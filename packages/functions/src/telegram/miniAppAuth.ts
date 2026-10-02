import crypto from "crypto";

/** The mini app's launch data is trusted for this long after Telegram signed it */
const MAX_AGE_SECONDS = 60 * 60;

/**
 * Checks the launch data a mini app received from Telegram (`Telegram.WebApp.initData`)
 * and returns the id of the Telegram user who opened it, or `null` if the data
 * wasn't signed by Telegram for this bot, or is too old.
 *
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export const getMiniAppUserId = (
  initData: unknown,
  botToken: string,
  now = Date.now(),
): number | null => {
  if (typeof initData !== "string") return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") || "";
  params.delete("hash");

  // All the fields received, sorted, one "key=value" per line
  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest();
  const received = Buffer.from(hash, "hex");
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    return null;
  }

  const age = now / 1000 - Number(params.get("auth_date"));
  if (!(age >= -60 && age <= MAX_AGE_SECONDS)) return null;

  try {
    const { id } = JSON.parse(params.get("user") || "{}");
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
};
