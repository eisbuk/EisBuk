/**
 * @vitest-environment node
 */

import { describe, test, expect } from "vitest";

import { scrubSecretKeys } from "../scrubSecretKeys";

const secretKey = "0b3e2a5c-1d4f-4a6b-9c8d-7e6f5a4b3c2d";

describe("scrubSecretKeys", () => {
  test("replaces secret keys in every string of a Sentry event", () => {
    const event = {
      message: `Failed for ${secretKey}`,
      request: {
        url: `https://example.web.app/customer_area/${secretKey}/book`,
        headers: { Referer: `https://example.web.app/${secretKey}` },
      },
      breadcrumbs: [
        { category: "navigation", data: { from: "/", to: `/x/${secretKey}` } },
      ],
      tags: { errorCode: "unavailable" },
      timestamp: 1759345200,
      extra: { ok: true, nothing: null },
    };

    expect(scrubSecretKeys(event)).toEqual({
      message: "Failed for <secret-key>",
      request: {
        url: "https://example.web.app/customer_area/<secret-key>/book",
        headers: { Referer: "https://example.web.app/<secret-key>" },
      },
      breadcrumbs: [
        {
          category: "navigation",
          data: { from: "/", to: "/x/<secret-key>" },
        },
      ],
      tags: { errorCode: "unavailable" },
      timestamp: 1759345200,
      extra: { ok: true, nothing: null },
    });
    // The original event is left untouched
    expect(event.request.url).toContain(secretKey);
  });

  test("leaves class instances as they are", () => {
    const date = new Date();
    expect(scrubSecretKeys({ date }).date).toBe(date);
  });
});
