import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

import { auth, adminDb, functions } from "@/__testSettings__";

import { Collection } from "eisbuk-shared";

import { CloudFunction } from "@/enums/functions";

import { deleteAllCollections } from "@/__testUtils__/firestore";
import { testWithEmulator } from "@/__testUtils__/envUtils";

import { loginWithEmail, loginWithPhone } from "@/__testUtils__/auth";

beforeAll(async () => {
  await deleteAllCollections(adminDb, [Collection.Organizations]);
  await signOut(auth);
});

describe("Cloud functions", () => {
  testWithEmulator(
    "should deny access to users not belonging to the organization",
    async () => {
      await adminDb
        .collection(Collection.Organizations)
        .doc("default")
        .set({
          admins: ["test@example.com", "+1234567890"],
        });
      // We're not logged in yet, so this should throw
      await expect(
        httpsCallable(
          functions,
          CloudFunction.CreateTestData
        )({
          organization: "default",
        })
      ).rejects.toThrow();

      // We log in with the wrong user
      await loginWithEmail("wrong@example.com");
      await expect(
        httpsCallable(
          functions,
          CloudFunction.CreateTestData
        )({
          organization: "default",
        })
      ).rejects.toThrow();

      // ...and with the right one
      await signOut(auth);
      await loginWithEmail("test@example.com");
      await httpsCallable(
        functions,
        CloudFunction.CreateTestData
      )({
        organization: "default",
      });

      // or using the phone number
      await signOut(auth);
      await loginWithPhone("+1234567890");
      await httpsCallable(
        functions,
        CloudFunction.CreateTestData
      )({
        organization: "default",
      });
    }
  );

  testWithEmulator("should respond if pinged", async (done) => {
    const result = httpsCallable(
      functions,
      CloudFunction.Ping
    )({
      foo: "bar",
    });
    expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
    done();
  });
});
