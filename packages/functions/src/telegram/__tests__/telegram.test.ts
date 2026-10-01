import { describe, expect, test } from "vitest";

import { getOwnPhone, normalizePhone } from "../identity";
import { splitMessage } from "../telegramApi";

describe("Telegram bot: identity", () => {
  test("should bring Telegram's phone numbers to the form used for phone sign-in", () => {
    expect(normalizePhone("393331234567")).toEqual("+393331234567");
    expect(normalizePhone("+39 333 123 4567")).toEqual("+393331234567");
    expect(normalizePhone("00393331234567")).toEqual("+393331234567");
  });

  test("should only trust the contact of the sender themselves", () => {
    const message = {
      message_id: 1,
      chat: { id: 7, type: "private" },
      from: { id: 7 },
    };

    expect(
      getOwnPhone({
        ...message,
        contact: { phone_number: "393331234567", user_id: 7 },
      }),
    ).toEqual("+393331234567");
    // Somebody else's contact card (forwarded, or picked from the address book)
    expect(
      getOwnPhone({
        ...message,
        contact: { phone_number: "393331234567", user_id: 8 },
      }),
    ).toEqual(null);
    // A contact not linked to any Telegram account
    expect(
      getOwnPhone({ ...message, contact: { phone_number: "393331234567" } }),
    ).toEqual(null);
    expect(getOwnPhone({ ...message, text: "+393331234567" })).toEqual(null);
  });
});

describe("Telegram bot: messages", () => {
  test("should split long texts at line ends, within Telegram's limit", () => {
    expect(splitMessage("short")).toEqual(["short"]);
    expect(splitMessage("aaaa\nbbbb\ncccc", 10)).toEqual([
      "aaaa\nbbbb",
      "cccc",
    ]);
    expect(splitMessage("aaaaaaaaaaaa", 5)).toEqual(["aaaaa", "aaaaa", "aa"]);
  });
});
