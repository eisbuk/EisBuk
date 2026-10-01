import * as functions from "firebase-functions";

import { Collection, OrgSubCollection } from "@eisbuk/shared";

import { SlotPlan } from "./slotPlan";

interface SlotWriteContext {
  organization: string;
  planId: string;
  telegramUserId: number;
}

type SlotOperation =
  | { op: "create"; collection: string; data: Record<string, unknown> }
  | { op: "set"; path: string; data: Record<string, unknown> }
  | { op: "delete"; path: string };

/**
 * Applies a confirmed plan to the organization's slots.
 */
export interface SlotWriter {
  apply(context: SlotWriteContext, plan: SlotPlan): Promise<void>;
}

/**
 * The firestore writes a plan amounts to: the same writes the web app makes
 * (new slot documents get their id from firestore, updates replace the document).
 */
export const getPlanOperations = (
  organization: string,
  plan: SlotPlan,
): SlotOperation[] => {
  const slotsPath = [
    Collection.Organizations,
    organization,
    OrgSubCollection.Slots,
  ].join("/");

  return [
    ...plan.creates.map((slot) => ({
      op: "create" as const,
      collection: slotsPath,
      data: { ...slot },
    })),
    ...plan.updates.map(({ id, after }) => ({
      op: "set" as const,
      path: `${slotsPath}/${id}`,
      data: { ...after },
    })),
    ...plan.deletes.map(({ id }) => ({
      op: "delete" as const,
      path: `${slotsPath}/${id}`,
    })),
  ];
};

/**
 * Prototype writer: records the writes in the function logs and changes nothing.
 */
export const logOnlySlotWriter: SlotWriter = {
  apply: async (context, plan) => {
    functions.logger.info(
      "Telegram bot: slot changes confirmed (log only, nothing was written)",
      {
        ...context,
        operations: getPlanOperations(context.organization, plan),
      },
    );
  },
};
