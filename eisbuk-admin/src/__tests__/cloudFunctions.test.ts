import { signOut } from "@firebase/auth";
import { httpsCallable } from "@firebase/functions";

import { Collection } from "eisbuk-shared";

import { auth, functions, adminDb } from "@/__testSetup__/firestoreSetup";

import { CloudFunction } from "@/enums/functions";

import { deleteAllCollections } from "@/__testUtils__/firestore";
import { testWithEmulator } from "@/__testUtils__/envUtils";

import {
  loginDefaultUser,
  loginWithEmail,
  // loginWithPhone,
} from "@/__testUtils__/auth";

beforeAll(async () => {
  await deleteAllCollections(adminDb, [Collection.Organizations]);
  await loginDefaultUser();
});

describe("Cloud functions", () => {
  testWithEmulator(
    "should deny access to users not belonging to the organization",
    async () => {
      const testOrg = "default";
      // here we're using adminDb to bypass firestore.rules check
      await adminDb
        .collection(Collection.Organizations)
        .doc(testOrg)
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

      /** @TODO phone login doesn't work in node enviroment, investigate or test with cypress */
      // await signOut(auth);
      // await loginWithPhone("+1234567890");
      // await httpsCallable(
      //   functions,
      //   CloudFunction.CreateTestData
      // )({
      //   organization: "default",
      // });
    }
  );

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
