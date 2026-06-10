import { describe, test, expect } from "vitest";

import { scrubPII } from "../scrub";

describe("scrubPII", () => {
  test("should replace values of PII keys at any depth with '[Filtered]'", () => {
    const event = {
      request: {
        url: "https://europe-west6-project.cloudfunctions.net/customerSelfRegister",
        data: {
          data: {
            organization: "test-org",
            registrationCode: "super-secret",
            customer: {
              name: "Ayla",
              surname: "Marucelli",
              birthday: "2013-02-02",
              email: "parent@example.com",
              phone: "+393331111111",
            },
          },
        },
      },
      user: { ip_address: "203.0.113.7", country: "IT" },
    };

    const scrubbed = scrubPII(event);

    expect(scrubbed.request.data.data.registrationCode).toEqual("[Filtered]");
    expect(scrubbed.request.data.data.customer).toEqual({
      name: "[Filtered]",
      surname: "[Filtered]",
      birthday: "[Filtered]",
      email: "[Filtered]",
      phone: "[Filtered]",
    });
    expect(scrubbed.user.ip_address).toEqual("[Filtered]");
    // Non-sensitive data is left intact
    expect(scrubbed.request.url).toEqual(event.request.url);
    expect(scrubbed.request.data.data.organization).toEqual("test-org");
    expect(scrubbed.user.country).toEqual("IT");
    // The input is not mutated
    expect(event.request.data.data.customer.name).toEqual("Ayla");
  });

  test("should handle arrays, null values and custom key lists", () => {
    const input = {
      list: [{ email: "a@b.c", keep: 1 }, null, "plain"],
      nothing: null,
    };
    expect(scrubPII(input)).toEqual({
      list: [{ email: "[Filtered]", keep: 1 }, null, "plain"],
      nothing: null,
    });

    expect(scrubPII({ foo: "x", bar: "y" }, ["foo"])).toEqual({
      foo: "[Filtered]",
      bar: "y",
    });
  });

  test("should not choke on circular references or class instances", () => {
    const circular: Record<string, any> = { email: "a@b.c" };
    circular.self = circular;
    expect(() => scrubPII(circular)).not.toThrow();
    expect(scrubPII(circular).email).toEqual("[Filtered]");

    const date = new Date(0);
    expect(scrubPII({ created: date }).created).toBe(date);
  });
});
