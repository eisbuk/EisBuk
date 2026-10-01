import admin from "firebase-admin";

import { Collection } from "@eisbuk/shared";

import { __isEmulator__ } from "../constants";

/**
 * Root collection for everything the Telegram bot stores, on per-organization basis:
 * - `telegramBot/{organization}/updates/{updateId}` - updates received from Telegram (work queue)
 * - `telegramBot/{organization}/users/{telegramUserId}` - phone number each Telegram user shared
 * - `telegramBot/{organization}/chats/{chatId}` - conversation with the assistant
 * - `telegramBot/{organization}/chats/{chatId}/plans/{planId}` - proposed slot changes
 *
 * None of these is matched in firestore rules: they're only accessible from cloud functions.
 */
export const TELEGRAM_BOT_COLLECTION = "telegramBot";

export const getBotRef = (organization: string) =>
  admin.firestore().collection(TELEGRAM_BOT_COLLECTION).doc(organization);

/**
 * Entries the bot reads from the organization's secrets document (`secrets/{organization}`),
 * next to the SMTP and SMS credentials.
 */
interface TelegramBotSecrets {
  /** Bot token issued by BotFather */
  telegramBotToken?: string;
  /** The `secret_token` passed to Telegram's `setWebhook`, sent back with each update */
  telegramWebhookSecret?: string;
  /** Fireworks AI API key, for the language model */
  fireworksApiKey?: string;
  /** Web API key of the firebase project, needed to sign in on behalf of the user */
  firebaseWebApiKey?: string;
  /** Emulator only: lets the tests stand in for Telegram's servers */
  telegramApiBaseUrl?: string;
  /** Emulator only: lets the tests stand in for the language model's API */
  llmBaseUrl?: string;
}

export interface BotConfig {
  organization: string;
  telegramBotToken: string;
  telegramWebhookSecret: string;
  telegramApiBaseUrl: string;
  fireworksApiKey?: string;
  llmBaseUrl?: string;
  firebaseWebApiKey?: string;
}

/**
 * Returns the bot config for the organization, or `null` if the bot
 * hasn't been set up for it (no bot token / webhook secret in the secrets document).
 */
export const getBotConfig = async (
  organization: string,
): Promise<BotConfig | null> => {
  const secretsSnap = await admin
    .firestore()
    .collection(Collection.Secrets)
    .doc(organization)
    .get();
  const secrets = (secretsSnap.data() || {}) as TelegramBotSecrets;

  const { telegramBotToken, telegramWebhookSecret } = secrets;
  if (!telegramBotToken || !telegramWebhookSecret) return null;

  return {
    organization,
    telegramBotToken,
    telegramWebhookSecret,
    telegramApiBaseUrl:
      (__isEmulator__ && secrets.telegramApiBaseUrl) ||
      "https://api.telegram.org",
    fireworksApiKey: secrets.fireworksApiKey,
    llmBaseUrl: __isEmulator__ ? secrets.llmBaseUrl : undefined,
    // Auth emulator accepts any key
    firebaseWebApiKey:
      secrets.firebaseWebApiKey || (__isEmulator__ ? "emulator" : undefined),
  };
};
