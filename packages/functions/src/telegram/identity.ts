import { TelegramMessage } from "./telegramApi";

/**
 * Brings a phone number as sent by Telegram (usually digits only, e.g. "393331234567")
 * to the form used for phone sign-in and stored in admin / athlete data ("+393331234567").
 */
export const normalizePhone = (phone: string): string =>
  `+${phone.replace(/[^\d]/g, "").replace(/^00/, "")}`;

/**
 * Returns the (normalized) phone number if the message carries the sender's own contact,
 * shared through the "share my number" button. A contact card of somebody else
 * (forwarded or picked from the address book) proves nothing and yields `null`.
 */
export const getOwnPhone = (message: TelegramMessage): string | null => {
  const { contact, from } = message;
  if (!contact || !from || contact.user_id !== from.id) return null;
  if (!/\d{6,}/.test(contact.phone_number.replace(/[^\d]/g, ""))) return null;
  return normalizePhone(contact.phone_number);
};
