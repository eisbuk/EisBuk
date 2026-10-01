import * as functions from "firebase-functions";
import admin from "firebase-admin";
import crypto from "crypto";

import { __functionsZone__ } from "../constants";

import { wrapFirestoreOnCreateHandler } from "../sentry-serverless-firebase";
import { getOrgAdmins, isOrgAdmin } from "../utils";

import {
  BotConfig,
  TELEGRAM_BOT_COLLECTION,
  getBotConfig,
  getBotRef,
} from "./config";
import {
  TelegramApi,
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from "./telegramApi";
import { getOwnPhone } from "./identity";
import { PermissionDeniedError, UserSession } from "./asUser";
import {
  AgentMessage,
  LlmApiError,
  ToolResult,
  createLlmClient,
  runAgentTurn,
} from "./agent";
import { SlotPlan, renderPlanPreview } from "./slotPlan";
import { createToolExecutor } from "./tools";
import { logOnlySlotWriter } from "./slotWriter";

// #region constants
enum UpdateStatus {
  Received = "received",
  Processing = "processing",
  Done = "done",
  Failed = "failed",
}

enum PlanStatus {
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
/** After this much silence the next message starts a new conversation */
const CONVERSATION_IDLE_HOURS = 2;
/** A conversation longer than this is started anew */
const MAX_CONVERSATION_MESSAGES = 60;
/** How long a chat stays reserved for the message being processed */
const CHAT_LEASE_SECONDS = 120;

const messages = {
  askForContact:
    "Ciao! Per sapere chi sei ho bisogno del tuo numero di telefono: tocca il pulsante qui sotto per condividerlo.",
  shareContactButton: "📱 Condividi il mio numero",
  notOwnContact:
    "Mi serve il tuo numero, non quello di un altro contatto: usa il pulsante qui sotto.",
  welcomeAdmin:
    "Numero verificato: sei tra gli amministratori. Scrivimi cosa ti serve sugli slot, ad esempio: «crea ghiaccio agonismo ogni martedì e giovedì di novembre dalle 17 alle 18».",
  notAdmin:
    "Il tuo numero non risulta tra gli amministratori. Per ora questo assistente è riservato a loro.",
  notConfigured:
    "L'assistente non è ancora configurato del tutto. Avvisa chi gestisce il sistema.",
  textOnly: "Per ora capisco solo i messaggi di testo.",
  newConversation: "Va bene, ricominciamo da capo. Cosa ti serve?",
  busy: "Un attimo, sto ancora lavorando alla tua richiesta precedente.",
  noAnswer:
    "Non sono riuscito a rispondere a questa richiesta. Prova a riformularla.",
  overloaded:
    "In questo momento ci sono troppe richieste. Riprova tra un minuto.",
  error: "Si è verificato un errore. Riprova tra poco.",
  confirmQuestion: "Confermi?",
  confirmButton: "✅ Conferma",
  cancelButton: "❌ Annulla",
  cancelled: "Annullato: non ho cambiato nulla.",
  planNotValid:
    "Questa proposta non è più valida. Dimmi di nuovo cosa vuoi fare.",
  loggedOnly: (plan: SlotPlan) =>
    `Confermato (${plan.creates.length} nuovi, ${plan.updates.length} modificati, ${plan.deletes.length} eliminati).\n\n⚠️ Modalità di prova: le modifiche sono state solo registrate, il calendario non è stato toccato.`,
};
// #endregion constants

// #region helpers
const { FieldValue, Timestamp } = admin.firestore;

const isAdminPhone = async (organization: string, phone: string) =>
  isOrgAdmin([phone], await getOrgAdmins(organization));

const getLinkedPhone = async (
  organization: string,
  telegramUserId: number,
): Promise<string | undefined> => {
  const userSnap = await getBotRef(organization)
    .collection("users")
    .doc(String(telegramUserId))
    .get();
  return userSnap.data()?.phone;
};

const getChatRef = (organization: string, chatId: number) =>
  getBotRef(organization).collection("chats").doc(String(chatId));

const askForContact = (api: TelegramApi, chatId: number, text: string) =>
  api.sendMessage(chatId, text, {
    keyboard: [[{ text: messages.shareContactButton, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  });

/** Failures of the niceties (typing indicator, button cleanup) shouldn't fail the update */
const ignoreErrors = (promise: Promise<unknown>) =>
  promise.catch((err) => functions.logger.warn(String(err)));
// #endregion helpers

// #region contact
const handleContact = async (
  config: BotConfig,
  api: TelegramApi,
  message: TelegramMessage,
) => {
  const chatId = message.chat.id;
  const phone = getOwnPhone(message);
  if (!phone || !message.from) {
    await askForContact(api, chatId, messages.notOwnContact);
    return;
  }

  await getBotRef(config.organization)
    .collection("users")
    .doc(String(message.from.id))
    .set({ phone, chatId, linkedAt: FieldValue.serverTimestamp() });

  const isAdmin = await isAdminPhone(config.organization, phone);
  await api.sendMessage(
    chatId,
    isAdmin ? messages.welcomeAdmin : messages.notAdmin,
    { remove_keyboard: true },
  );
};
// #endregion contact

// #region conversation
interface ChatData {
  /** JSON of the messages exchanged with the model */
  history?: string;
  updatedAt?: admin.firestore.Timestamp;
  busyUntil?: admin.firestore.Timestamp;
  /** Events to tell the model about on the next turn */
  notes?: string[];
  pendingPlanId?: string;
}

/**
 * Reserves the chat for one message at a time: two turns running
 * side by side would overwrite each other's conversation history.
 * Returns the chat's data, or `null` if the chat is busy.
 */
const acquireChat = (
  chatRef: admin.firestore.DocumentReference,
): Promise<ChatData | null> =>
  admin.firestore().runTransaction(async (tx) => {
    const chat = ((await tx.get(chatRef)).data() || {}) as ChatData;
    if (chat.busyUntil && chat.busyUntil.toMillis() > Date.now()) return null;
    tx.set(
      chatRef,
      {
        busyUntil: Timestamp.fromMillis(Date.now() + CHAT_LEASE_SECONDS * 1000),
      },
      { merge: true },
    );
    return chat;
  });

const loadHistory = (chat: ChatData): AgentMessage[] => {
  const history: AgentMessage[] = JSON.parse(chat.history || "[]");
  const idleSince = chat.updatedAt?.toMillis() || 0;
  const isStale =
    Date.now() - idleSince > CONVERSATION_IDLE_HOURS * 60 * 60 * 1000;
  return isStale || history.length > MAX_CONVERSATION_MESSAGES ? [] : history;
};

/**
 * The tools the model can call, run with the privileges of the admin who wrote the message.
 */
const createAdminToolExecutor = (params: {
  session: UserSession;
  chatRef: admin.firestore.DocumentReference;
  telegramUserId: number;
  /** Called with each plan proposed during the turn */
  onPlan: (planId: string, plan: SlotPlan) => void;
}) => {
  const { session, chatRef, telegramUserId, onPlan } = params;

  const executeTool = createToolExecutor({
    calendar: session,
    onPlan: async (plan) => {
      const planRef = chatRef.collection("plans").doc();
      await planRef.set({
        status: PlanStatus.Pending,
        telegramUserId,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(
          Date.now() + PLAN_TTL_MINUTES * 60 * 1000,
        ),
        plan: JSON.stringify(plan),
      });
      onPlan(planRef.id, plan);
    },
  });

  return async (name: string, input: unknown): Promise<ToolResult> => {
    try {
      return await executeTool(name, input);
    } catch (err) {
      if (!(err instanceof PermissionDeniedError)) throw err;
      // The phone number is in the admins list (checked before the turn), but firestore rules
      // didn't see an admin: the user's token and the rules disagree, which needs looking into
      functions.logger.error("Telegram bot: firestore rules denied an admin", {
        tool: name,
        telegramUserId,
      });
      return {
        content:
          "The administrator's account was denied access to the calendar. Tell them it's a configuration problem to report.",
        isError: true,
      };
    }
  };
};

const getErrorReply = (err: unknown) => {
  if (!(err instanceof LlmApiError)) return messages.error;
  if (err.status === 401 || err.status === 403) return messages.notConfigured;
  return err.status === 429 ? messages.overloaded : messages.error;
};

const handleText = async (
  config: BotConfig,
  api: TelegramApi,
  message: TelegramMessage,
) => {
  const { organization, fireworksApiKey, firebaseWebApiKey } = config;
  const chatId = message.chat.id;
  const text = (message.text || "").trim();
  if (!message.from) return;

  const phone = await getLinkedPhone(organization, message.from.id);
  if (!phone || text === "/start") {
    await askForContact(api, chatId, messages.askForContact);
    return;
  }
  if (!text) {
    // A photo, a voice message, a sticker...
    await api.sendMessage(chatId, messages.textOnly);
    return;
  }
  if (!(await isAdminPhone(organization, phone))) {
    await api.sendMessage(chatId, messages.notAdmin);
    return;
  }

  const chatRef = getChatRef(organization, chatId);
  if (text === "/nuovo") {
    await chatRef.set({ history: "[]", notes: [] }, { merge: true });
    await api.sendMessage(chatId, messages.newConversation);
    return;
  }
  if (!fireworksApiKey || !firebaseWebApiKey) {
    await api.sendMessage(chatId, messages.notConfigured);
    return;
  }

  const chat = await acquireChat(chatRef);
  if (!chat) {
    await api.sendMessage(chatId, messages.busy);
    return;
  }

  try {
    await ignoreErrors(api.sendTyping(chatId));

    const session = await UserSession.signIn({
      phone,
      organization,
      firebaseWebApiKey,
    });

    // Only the last proposal of the turn is put forward for confirmation
    const proposed: { planId: string; plan: SlotPlan }[] = [];
    const plansRef = chatRef.collection("plans");
    const supersede = (planIds: (string | undefined)[]) =>
      Promise.all(
        planIds.map(
          (planId) =>
            planId &&
            plansRef
              .doc(planId)
              .update({ status: PlanStatus.Superseded })
              // Already confirmed, cancelled or gone
              .catch(() => undefined),
        ),
      );

    const { reply, history } = await runAgentTurn({
      llm: createLlmClient({
        apiKey: fireworksApiKey,
        baseUrl: config.llmBaseUrl,
      }),
      history: loadHistory(chat),
      userText: text,
      notes: chat.notes,
      executeTool: createAdminToolExecutor({
        session,
        chatRef,
        telegramUserId: message.from.id,
        onPlan: (planId, plan) => proposed.push({ planId, plan }),
      }),
    });

    const current = reply ? proposed[proposed.length - 1] : undefined;
    const outdated = proposed
      .map(({ planId }) => planId)
      .filter((planId) => planId !== current?.planId);
    // A new proposal takes the place of the one still waiting from an earlier turn
    await supersede(current ? [...outdated, chat.pendingPlanId] : outdated);

    await chatRef.set(
      {
        history: JSON.stringify(history),
        updatedAt: FieldValue.serverTimestamp(),
        // The notes the model has now seen (others might have come in during the turn)
        ...(reply && chat.notes?.length
          ? { notes: FieldValue.arrayRemove(...chat.notes) }
          : {}),
        ...(current ? { pendingPlanId: current.planId } : {}),
      },
      { merge: true },
    );

    await api.sendMessage(chatId, reply || messages.noAnswer);
    if (current) {
      await api.sendMessage(
        chatId,
        `${renderPlanPreview(current.plan)}\n\n${messages.confirmQuestion}`,
        {
          inline_keyboard: [
            [
              {
                text: messages.confirmButton,
                callback_data: `plan:${current.planId}:confirm`,
              },
              {
                text: messages.cancelButton,
                callback_data: `plan:${current.planId}:cancel`,
              },
            ],
          ],
        },
      );
    }
  } finally {
    await chatRef.set({ busyUntil: FieldValue.delete() }, { merge: true });
  }
};
// #endregion conversation

// #region confirmation
type PlanOutcome =
  | { status: PlanStatus.Confirmed; plan: SlotPlan }
  | { status: PlanStatus.Cancelled | PlanStatus.Expired }
  | null;

/**
 * Handles the "Conferma" / "Annulla" buttons under a proposal. The language model
 * is not involved here: the plan stored with the proposal is the one that gets applied.
 */
const handleCallbackQuery = async (
  config: BotConfig,
  api: TelegramApi,
  query: TelegramCallbackQuery,
) => {
  const { organization } = config;
  await ignoreErrors(api.answerCallbackQuery(query.id));

  const chatId = query.message?.chat.id;
  const match = /^plan:([A-Za-z0-9]+):(confirm|cancel)$/.exec(query.data || "");
  if (!chatId || !query.message || !match) return;
  const [, planId, action] = match;

  // The button might be pressed long after the proposal: check again who's asking
  const phone = await getLinkedPhone(organization, query.from.id);
  if (!phone || !(await isAdminPhone(organization, phone))) {
    await api.sendMessage(chatId, messages.notAdmin);
    return;
  }

  const chatRef = getChatRef(organization, chatId);
  const planRef = chatRef.collection("plans").doc(planId);

  const outcome = await admin
    .firestore()
    .runTransaction(async (tx): Promise<PlanOutcome> => {
      const data = (await tx.get(planRef)).data();
      if (
        !data ||
        data.status !== PlanStatus.Pending ||
        data.telegramUserId !== query.from.id
      ) {
        return null;
      }
      const status =
        data.expiresAt.toMillis() < Date.now()
          ? PlanStatus.Expired
          : action === "confirm"
            ? PlanStatus.Confirmed
            : PlanStatus.Cancelled;
      tx.update(planRef, { status });
      return status === PlanStatus.Confirmed
        ? { status, plan: JSON.parse(data.plan) }
        : { status };
    });

  await ignoreErrors(api.removeButtons(chatId, query.message.message_id));

  const tellModel = (note: string) =>
    chatRef.set({ notes: FieldValue.arrayUnion(note) }, { merge: true });

  if (outcome?.status === PlanStatus.Confirmed) {
    await logOnlySlotWriter.apply(
      { organization, planId, telegramUserId: query.from.id },
      outcome.plan,
    );
    await planRef.update({ status: PlanStatus.Logged });
    await tellModel(
      "The administrator confirmed the last proposal. Test mode: the changes were recorded, the calendar was not changed.",
    );
    await api.sendMessage(chatId, messages.loggedOnly(outcome.plan));
    return;
  }
  if (outcome?.status === PlanStatus.Cancelled) {
    await tellModel("The administrator cancelled the last proposal.");
    await api.sendMessage(chatId, messages.cancelled);
    return;
  }
  await api.sendMessage(chatId, messages.planNotValid);
};
// #endregion confirmation

// #region functions
const isValidSecret = (received: unknown, expected: string) => {
  if (typeof received !== "string") return false;
  const [a, b] = [Buffer.from(received), Buffer.from(expected)];
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * The endpoint Telegram delivers the bot's updates to. Should be registered as:
 * `https://<region>-<project>.cloudfunctions.net/telegramWebhook?organization=<organization>`
 *
 * It only stores the update and responds right away (Telegram resends updates that aren't
 * acknowledged quickly): the work is done by `processTelegramUpdate`.
 */
export const telegramWebhook = functions
  .runWith({
    memory: "256MB",
  })
  .region(__functionsZone__)
  .https.onRequest(async (req, res) => {
    const organization = req.query.organization;
    const config =
      req.method === "POST" &&
      typeof organization === "string" &&
      /^[^/]+$/.test(organization)
        ? await getBotConfig(organization)
        : null;
    if (!config) {
      res.status(404).send("Not found");
      return;
    }

    const secret = req.header("X-Telegram-Bot-Api-Secret-Token");
    if (!isValidSecret(secret, config.telegramWebhookSecret)) {
      res.status(403).send("Forbidden");
      return;
    }

    const update = req.body as TelegramUpdate;
    if (!Number.isInteger(update?.update_id)) {
      res.status(400).send("Not a Telegram update");
      return;
    }

    try {
      await getBotRef(config.organization)
        .collection("updates")
        .doc(String(update.update_id))
        .create({
          update,
          status: UpdateStatus.Received,
          receivedAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
      // gRPC ALREADY_EXISTS: Telegram delivered the same update twice
      if ((err as { code?: number }).code !== 6) throw err;
    }

    res.status(200).send("OK");
  });

/**
 * Processes an update stored by `telegramWebhook`: links the Telegram user to a phone
 * number, runs the assistant on a message, or applies a confirmed proposal.
 */
export const processTelegramUpdate = functions
  .runWith({
    memory: "512MB",
    timeoutSeconds: 300,
  })
  .region(__functionsZone__)
  .firestore.document(
    `${TELEGRAM_BOT_COLLECTION}/{organization}/updates/{updateId}`,
  )
  .onCreate(
    wrapFirestoreOnCreateHandler(
      "processTelegramUpdate",
      async ({ ref }, context) => {
        const { organization } = context.params as Record<string, string>;

        // Triggers are delivered at least once: make sure the update is processed only once
        const update = await admin.firestore().runTransaction(async (tx) => {
          const data = (await tx.get(ref)).data();
          if (data?.status !== UpdateStatus.Received) return null;
          tx.update(ref, { status: UpdateStatus.Processing });
          return data.update as TelegramUpdate;
        });
        const config = await getBotConfig(organization);
        if (!update || !config) return;

        const api = new TelegramApi(config);
        const { message, callback_query: callbackQuery } = update;

        try {
          if (callbackQuery) {
            await handleCallbackQuery(config, api, callbackQuery);
          } else if (message?.chat.type === "private") {
            // The bot only talks in private chats: a phone number shared in a group proves nothing
            await (message.contact
              ? handleContact(config, api, message)
              : handleText(config, api, message));
          }
          // The update (with the text of the message) is not kept: the document stays to recognise duplicates
          await ref.update({
            status: UpdateStatus.Done,
            update: FieldValue.delete(),
          });
        } catch (err) {
          await ref.update({
            status: UpdateStatus.Failed,
            update: FieldValue.delete(),
          });
          const chatId = (message || callbackQuery?.message)?.chat.id;
          if (chatId) {
            await ignoreErrors(api.sendMessage(chatId, getErrorReply(err)));
          }
          throw err;
        }
      },
    ),
  );
// #endregion functions
