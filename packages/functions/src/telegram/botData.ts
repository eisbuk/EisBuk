import * as functions from "firebase-functions";
import admin from "firebase-admin";

import { __functionsZone__ } from "../constants";

import { getOrgAdmins, isOrgAdmin } from "../utils";

import { BotConfig, getBotRef } from "./config";
import { messages } from "./messages";
import {
  PlanSelection,
  SlotPlan,
  applySelection,
  countOperations,
} from "./slotPlan";
import { logOnlySlotWriter } from "./slotWriter";
import { TelegramApi } from "./telegramApi";

const { FieldValue, Timestamp } = admin.firestore;

// #region users
export const isAdminPhone = async (organization: string, phone: string) =>
  isOrgAdmin([phone], await getOrgAdmins(organization));

/** The phone number the Telegram user shared with the bot (if they did) */
export const getLinkedPhone = async (
  organization: string,
  telegramUserId: number,
): Promise<string | undefined> => {
  const userSnap = await getBotRef(organization)
    .collection("users")
    .doc(String(telegramUserId))
    .get();
  return userSnap.data()?.phone;
};

/** Whether the Telegram user has shared a phone number that's among the organization's admins */
export const isLinkedAdmin = async (
  organization: string,
  telegramUserId: number,
) => {
  const phone = await getLinkedPhone(organization, telegramUserId);
  return Boolean(phone) && isAdminPhone(organization, phone as string);
};
// #endregion users

// #region helpers
export const getChatRef = (organization: string, chatId: number) =>
  getBotRef(organization).collection("chats").doc(String(chatId));

/** Failures of the niceties (typing indicator, button cleanup) shouldn't fail the request */
export const ignoreErrors = (promise: Promise<unknown>) =>
  promise.catch((err) => functions.logger.warn(String(err)));

/**
 * Address of the bot's mini app (the `telegramMiniApp` function) for the organization
 */
export const getMiniAppUrl = (
  organization: string,
  params: Record<string, string>,
) =>
  `https://${__functionsZone__}-${
    process.env.GCLOUD_PROJECT
  }.cloudfunctions.net/telegramMiniApp?${new URLSearchParams({
    organization,
    ...params,
  })}`;
// #endregion helpers

// #region plans
export enum PlanStatus {
  Pending = "pending",
  /** Replaced by a newer proposal, or the turn that produced it didn't complete */
  Superseded = "superseded",
  Cancelled = "cancelled",
  Expired = "expired",
  Confirmed = "confirmed",
  /** Confirmed and handed over to the (log only) writer */
  Logged = "logged",
}

/** A proposal can be confirmed for this long: after that the calendar might have changed */
const PLAN_TTL_MINUTES = 30;

/**
 * Proposals are kept with the chat they were made in. The bot only talks
 * in private chats, where the id of the chat is the id of the user.
 */
const getPlanRef = (organization: string, chatId: number, planId: string) =>
  getChatRef(organization, chatId).collection("plans").doc(planId);

/** Stores a proposal waiting for the admin's confirmation, returns its id */
export const createPendingPlan = async (
  organization: string,
  telegramUserId: number,
  plan: SlotPlan,
) => {
  const planRef = getChatRef(organization, telegramUserId)
    .collection("plans")
    .doc();
  await planRef.set({
    status: PlanStatus.Pending,
    telegramUserId,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + PLAN_TTL_MINUTES * 60 * 1000),
    plan: JSON.stringify(plan),
  });
  return planRef.id;
};

/** Marks the proposals as replaced (the ones already confirmed, cancelled or gone are left alone) */
export const supersedePlans = (
  organization: string,
  chatId: number,
  planIds: (string | undefined)[],
) =>
  Promise.all(
    planIds.map(
      (planId) =>
        planId &&
        getPlanRef(organization, chatId, planId)
          .update({ status: PlanStatus.Superseded })
          .catch(() => undefined),
    ),
  );

/** Remembers the message showing the proposal, to take its buttons off once it's resolved */
export const setPlanPreviewMessage = (
  organization: string,
  chatId: number,
  planId: string,
  previewMessageId: number | undefined,
) =>
  previewMessageId
    ? getPlanRef(organization, chatId, planId).update({ previewMessageId })
    : Promise.resolve();

/**
 * Returns the proposal of the user's (if any), with its current status
 */
export const getPlan = async (
  organization: string,
  telegramUserId: number,
  planId: string,
): Promise<{ status: PlanStatus; plan: SlotPlan } | null> => {
  const data = (
    await getPlanRef(organization, telegramUserId, planId).get()
  ).data();
  if (!data || data.telegramUserId !== telegramUserId) return null;
  const isExpired =
    data.status === PlanStatus.Pending &&
    data.expiresAt.toMillis() < Date.now();
  return {
    status: isExpired ? PlanStatus.Expired : data.status,
    plan: JSON.parse(data.plan),
  };
};

type PlanResolution =
  | PlanStatus.Logged
  | PlanStatus.Cancelled
  | PlanStatus.Expired
  /** The selection left nothing to confirm: the proposal is still waiting */
  | "nothing-selected"
  /** Not there, not the user's, or already resolved */
  | null;

/**
 * Confirms or cancels a proposal, on the admin's request (a button under the proposal,
 * or the mini app), and tells the outcome in the chat. The language model is not involved:
 * what gets applied is the plan stored with the proposal, or the part of it the admin kept.
 *
 * The caller is expected to have checked that the user is (still) an admin.
 * Once the proposal is resolved, failing to say so in the chat doesn't undo it.
 */
export const resolvePlan = async (params: {
  config: BotConfig;
  api: TelegramApi;
  telegramUserId: number;
  planId: string;
  action: "confirm" | "cancel";
  selection?: PlanSelection;
  /** Set if the caller has already taken the buttons off the message showing the proposal */
  buttonsRemoved?: boolean;
}): Promise<PlanResolution> => {
  const { config, api, telegramUserId, planId, action, selection } = params;
  const { organization } = config;
  const chatId = telegramUserId;
  const chatRef = getChatRef(organization, chatId);
  const planRef = getPlanRef(organization, chatId, planId);

  const outcome = await admin.firestore().runTransaction(async (tx) => {
    const data = (await tx.get(planRef)).data();
    if (
      !data ||
      data.status !== PlanStatus.Pending ||
      data.telegramUserId !== telegramUserId
    ) {
      return null;
    }
    const { previewMessageId } = data;
    if (data.expiresAt.toMillis() < Date.now()) {
      tx.update(planRef, { status: PlanStatus.Expired });
      return { status: PlanStatus.Expired as const, previewMessageId };
    }
    if (action === "cancel") {
      tx.update(planRef, { status: PlanStatus.Cancelled });
      return { status: PlanStatus.Cancelled as const, previewMessageId };
    }

    const proposed: SlotPlan = JSON.parse(data.plan);
    const plan = selection ? applySelection(proposed, selection) : proposed;
    if (!countOperations(plan)) return { status: "nothing-selected" as const };

    tx.update(planRef, {
      status: PlanStatus.Confirmed,
      ...(selection ? { confirmedPlan: JSON.stringify(plan) } : {}),
    });
    const leftOut = countOperations(proposed) - countOperations(plan);
    return {
      status: PlanStatus.Confirmed as const,
      previewMessageId,
      plan,
      leftOut,
    };
  });

  if (!outcome) {
    await ignoreErrors(api.sendMessage(chatId, messages.planNotValid));
    return null;
  }
  if (outcome.status === "nothing-selected") return outcome.status;

  if (outcome.previewMessageId && !params.buttonsRemoved) {
    await ignoreErrors(api.removeButtons(chatId, outcome.previewMessageId));
  }
  const tellModel = (note: string) =>
    chatRef.set({ notes: FieldValue.arrayUnion(note) }, { merge: true });

  switch (outcome.status) {
    case PlanStatus.Confirmed:
      await logOnlySlotWriter.apply(
        { organization, planId, telegramUserId },
        outcome.plan,
      );
      await planRef.update({ status: PlanStatus.Logged });
      await tellModel(
        `The administrator confirmed the last proposal${
          outcome.leftOut
            ? `, after taking ${outcome.leftOut} of its changes out`
            : ""
        }. Test mode: the changes were recorded, the calendar was not changed.`,
      );
      await ignoreErrors(
        api.sendMessage(chatId, messages.loggedOnly(outcome.plan)),
      );
      return PlanStatus.Logged;

    case PlanStatus.Cancelled:
      await tellModel("The administrator cancelled the last proposal.");
      await ignoreErrors(api.sendMessage(chatId, messages.cancelled));
      return PlanStatus.Cancelled;

    default:
      await ignoreErrors(api.sendMessage(chatId, messages.planNotValid));
      return PlanStatus.Expired;
  }
};
// #endregion plans
