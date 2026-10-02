import * as functions from "firebase-functions";
import admin from "firebase-admin";
import crypto from "crypto";

import { __functionsZone__ } from "../constants";

import { wrapFirestoreOnCreateHandler } from "../sentry-serverless-firebase";

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
import {
  createPendingPlan,
  getChatRef,
  getLinkedPhone,
  getMiniAppUrl,
  ignoreErrors,
  isAdminPhone,
  isLinkedAdmin,
  resolvePlan,
  setPlanPreviewMessage,
  supersedePlans,
} from "./botData";
import { messages } from "./messages";
import { SlotPlan, renderPlanPreview } from "./slotPlan";
import { createToolExecutor } from "./tools";

export { telegramMiniApp } from "./miniApp";

// #region constants
enum UpdateStatus {
  Received = "received",
  Processing = "processing",
  Done = "done",
  Failed = "failed",
}

/** After this much silence the next message starts a new conversation */
const CONVERSATION_IDLE_HOURS = 2;
/** A conversation longer than this is started anew */
const MAX_CONVERSATION_MESSAGES = 60;
/** How long a chat stays reserved for the message being processed */
const CHAT_LEASE_SECONDS = 120;

const { FieldValue, Timestamp } = admin.firestore;
// #endregion constants

// #region contact
/**
 * Asks for the user's phone number, with a button opening the mini app:
 * it works the same on every Telegram client.
 */
const askForContact = (
  api: TelegramApi,
  organization: string,
  chatId: number,
  text: string,
) =>
  api.sendMessage(chatId, text, {
    inline_keyboard: [
      [
        {
          text: messages.shareContactButton,
          web_app: { url: getMiniAppUrl(organization, { mode: "contact" }) },
        },
      ],
    ],
  });

/**
 * The same request, with Telegram's own "share contact" keyboard button: a fallback for
 * clients that can't open mini apps (some clients keep this keyboard folded behind an icon).
 */
const askForContactWithKeyboard = (api: TelegramApi, chatId: number) =>
  api.sendMessage(chatId, messages.askForContactKeyboard, {
    keyboard: [[{ text: messages.shareContactButton, request_contact: true }]],
    resize_keyboard: true,
    is_persistent: true,
  });

const handleContact = async (
  config: BotConfig,
  api: TelegramApi,
  message: TelegramMessage,
) => {
  const chatId = message.chat.id;
  const phone = getOwnPhone(message);
  if (!phone || !message.from) {
    await askForContact(
      api,
      config.organization,
      chatId,
      messages.notOwnContact,
    );
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
  organization: string;
  session: UserSession;
  telegramUserId: number;
  /** Called with each plan proposed during the turn */
  onPlan: (planId: string, plan: SlotPlan) => void;
}) => {
  const { organization, session, telegramUserId, onPlan } = params;

  const executeTool = createToolExecutor({
    calendar: session,
    onPlan: async (plan) => {
      onPlan(await createPendingPlan(organization, telegramUserId, plan), plan);
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

/**
 * Puts a proposal forward: the exact list of changes, with buttons to confirm or cancel
 * it as it is, and one opening the mini app, where single changes can be left out.
 */
const sendPlanPreview = async (
  api: TelegramApi,
  organization: string,
  chatId: number,
  planId: string,
  plan: SlotPlan,
) => {
  const messageId = await api.sendMessage(
    chatId,
    `${renderPlanPreview(plan)}\n\n${messages.confirmQuestion}`,
    {
      inline_keyboard: [
        [
          {
            text: messages.confirmButton,
            callback_data: `plan:${planId}:confirm`,
          },
          {
            text: messages.cancelButton,
            callback_data: `plan:${planId}:cancel`,
          },
        ],
        [
          {
            text: messages.openPreviewButton,
            web_app: { url: getMiniAppUrl(organization, { plan: planId }) },
          },
        ],
      ],
    },
  );
  await setPlanPreviewMessage(organization, chatId, planId, messageId);
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

  if (text === "/tastiera") {
    await askForContactWithKeyboard(api, chatId);
    return;
  }
  const phone = await getLinkedPhone(organization, message.from.id);
  if (!phone || text === "/start") {
    await askForContact(api, organization, chatId, messages.askForContact);
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

    const { reply, history } = await runAgentTurn({
      llm: createLlmClient({
        apiKey: fireworksApiKey,
        baseUrl: config.llmBaseUrl,
      }),
      history: loadHistory(chat),
      userText: text,
      notes: chat.notes,
      executeTool: createAdminToolExecutor({
        organization,
        session,
        telegramUserId: message.from.id,
        onPlan: (planId, plan) => proposed.push({ planId, plan }),
      }),
    });

    const current = reply ? proposed[proposed.length - 1] : undefined;
    const outdated = proposed
      .map(({ planId }) => planId)
      .filter((planId) => planId !== current?.planId);
    // A new proposal takes the place of the one still waiting from an earlier turn
    await supersedePlans(
      organization,
      chatId,
      current ? [...outdated, chat.pendingPlanId] : outdated,
    );

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
      await sendPlanPreview(
        api,
        organization,
        chatId,
        current.planId,
        current.plan,
      );
    }
  } finally {
    await chatRef.set({ busyUntil: FieldValue.delete() }, { merge: true });
  }
};
// #endregion conversation

// #region confirmation
/**
 * Handles the "Conferma" / "Annulla" buttons under a proposal.
 */
const handleCallbackQuery = async (
  config: BotConfig,
  api: TelegramApi,
  query: TelegramCallbackQuery,
) => {
  await ignoreErrors(api.answerCallbackQuery(query.id));

  const chatId = query.message?.chat.id;
  const match = /^plan:([A-Za-z0-9]+):(confirm|cancel)$/.exec(query.data || "");
  if (!chatId || !query.message || !match) return;
  const [, planId, action] = match;

  // The button might be pressed long after the proposal: check again who's asking
  if (!(await isLinkedAdmin(config.organization, query.from.id))) {
    await api.sendMessage(chatId, messages.notAdmin);
    return;
  }

  await ignoreErrors(api.removeButtons(chatId, query.message.message_id));
  await resolvePlan({
    config,
    api,
    telegramUserId: query.from.id,
    planId,
    action: action as "confirm" | "cancel",
    buttonsRemoved: true,
  });
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
    memory: "512MB",
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
