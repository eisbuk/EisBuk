import { httpsCallable, FunctionsError } from "@firebase/functions";
import { signOut } from "@firebase/auth";

import { HTTPSErrors } from "eisbuk-shared";

import { auth, functions } from "@/__testSetup__/firestoreSetup";

import { getOrganization } from "@/lib/getters";

import { CloudFunction } from "@/enums/functions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { loginDefaultUser } from "@/__testUtils__/auth";

describe("Cloud functions", () => {
  beforeEach(async () => {
    await loginDefaultUser();
  });

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

    testWithEmulator(
      "should reject if user not authenticaten (and not an admin)",
      async () => {
        await signOut(auth);
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ organization, html, subject })
        ).rejects.toThrow(HTTPSErrors.Unauth);
      }
    );

    testWithEmulator(
      "should reject if no value for organziation provided",
      async () => {
        await expect(
          httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ to, html, subject })
        ).rejects.toThrow(HTTPSErrors.Unauth);
      }
    );

    testWithEmulator(
      "should reject if no recipient, html or subject provided",
      async () => {
        try {
          await httpsCallable(
            functions,
            CloudFunction.SendEmail
          )({ organization });
        } catch (error) {
          const { code, details } = error as FunctionsError;
          expect(code).toEqual("functions/invalid-argument");
          expect(details).toEqual({ missingFields: ["to", "subject", "html"] });
        }
      }
    );
  });
});
