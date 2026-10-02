import { BotConfig } from "./config";

// #region types
/** The parts of Telegram's Bot API objects the bot makes use of */
export interface TelegramUser {
  id: number;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  contact?: { phone_number: string; user_id?: number };
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

type ReplyMarkup = Record<string, unknown>;
// #endregion types

/** Telegram rejects messages longer than this */
const MAX_MESSAGE_LENGTH = 4096;

/**
 * Splits the text into chunks Telegram accepts, breaking at line ends where possible.
 */
export const splitMessage = (
  text: string,
  maxLength = MAX_MESSAGE_LENGTH,
): string[] => {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > maxLength) {
    const lineEnd = rest.lastIndexOf("\n", maxLength);
    const cut = lineEnd > 0 ? lineEnd : maxLength;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  return [...chunks, rest];
};

/**
 * A client for the methods of Telegram's Bot API the bot makes use of.
 */
export class TelegramApi {
  /** @param config token of the bot and the base url of the API */
  constructor(
    private config: Pick<BotConfig, "telegramBotToken" | "telegramApiBaseUrl">,
  ) {}

  /** Calls a Bot API method, throws if Telegram reports a failure */
  private async call(method: string, payload: Record<string, unknown>) {
    const { telegramApiBaseUrl, telegramBotToken } = this.config;
    const res = await fetch(
      `${telegramApiBaseUrl}/bot${telegramBotToken}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };
    if (!res.ok || !body.ok) {
      // The request URL holds the bot token: keep it out of the error
      throw new Error(
        `Telegram ${method} failed (${res.status}): ${body.description || ""}`,
      );
    }
    return body.result;
  }

  /**
   * Sends a plain text message. Long texts are sent as several messages,
   * with the reply markup (buttons) attached to the last one.
   *
   * @returns the id of the (last) message sent
   */
  async sendMessage(
    chatId: number,
    text: string,
    replyMarkup?: ReplyMarkup,
  ): Promise<number | undefined> {
    const chunks = splitMessage(text);
    let messageId: number | undefined;
    for (const [i, chunk] of chunks.entries()) {
      const isLast = i === chunks.length - 1;
      // One at a time: the chunks have to arrive in order
      // eslint-disable-next-line no-await-in-loop
      const result = await this.call("sendMessage", {
        chat_id: chatId,
        text: chunk,
        ...(isLast && replyMarkup ? { reply_markup: replyMarkup } : {}),
      });
      messageId = result?.message_id;
    }
    return messageId;
  }

  /** Shows "typing..." in the chat, for a few seconds or until the next message */
  sendTyping(chatId: number) {
    return this.call("sendChatAction", { chat_id: chatId, action: "typing" });
  }

  /** Stops the loading animation on the button the user pressed */
  answerCallbackQuery(callbackQueryId: string) {
    return this.call("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
    });
  }

  /** Removes the inline buttons from a message sent earlier */
  removeButtons(chatId: number, messageId: number) {
    return this.call("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] },
    });
  }
}
