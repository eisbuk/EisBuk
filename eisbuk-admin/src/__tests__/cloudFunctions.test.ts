import { httpsCallable } from "@firebase/functions";

import { HTTPErrors, SendEmailErrors } from "eisbuk-shared";

import { functions } from "@/__testSetup__/firestoreSetup";

import { CloudFunction } from "@/enums/functions";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { getOrganization } from "@/lib/getters";

describe("Cloud functions", () => {
  describe("ping", () => {
    testWithEmulator("should respond if pinged", async (done) => {
      const result = await httpsCallable(
        functions,
        CloudFunction.Ping
      )({
        foo: "bar",
      });
      expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
      done();
    });
  });

  describe("sendMail", () => {
    // Dummy data for error testing
    const to = "saul@gmail.com";
    const subject = "Subject";
    const html = "html";
    const organization = getOrganization();

    testWithEmulator("should reject if no payload provided", async () => {
      await expect(
        httpsCallable(functions, CloudFunction.SendEmail)()
      ).rejects.toThrow(HTTPErrors.NoPayload);
    });

    testWithEmulator(
      "should reject if no value for organziation provided",
      async () => {
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ to, message: { html, subject } })
        ).rejects.toThrow(SendEmailErrors.NoOrganziation);
      }
    );

    testWithEmulator("should reject if no recipient provided", async () => {
      await expect(
        httpsCallable(
          functions,
          CloudFunction.SendEmail
        )({ organization, message: { html, subject } })
      ).rejects.toThrow(SendEmailErrors.NoRecipient);
    });

    testWithEmulator("should reject if no email body provided", async () => {
      await expect(
        httpsCallable(
          functions,
          CloudFunction.SendEmail
        )({ to, organization, message: { subject } })
      ).rejects.toThrow(SendEmailErrors.NoMsgBody);
    });

    testWithEmulator("should reject if no subject provided", async () => {
      await expect(
        httpsCallable(
          functions,
          CloudFunction.SendEmail
        )({ to, organization, message: { html } })
      ).rejects.toThrow(SendEmailErrors.NoSubject);
    });
  });
});
