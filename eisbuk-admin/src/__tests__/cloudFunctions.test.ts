import firebase from "firebase/app";
import "firebase/functions";

import { Collection } from "eisbuk-shared";

import { adminDb } from "@/__testSettings__";

import { __functionsZone__ } from "@/lib/constants";

import { CloudFunction } from "@/enums/functions";

import { deleteAllCollections } from "@/__testUtils__/firestore";
import { testWithEmulator } from "@/__testUtils__/envUtils";

import { loginWithEmail, loginWithPhone } from "@/__testUtils__/auth";

beforeAll(async () => {
  await deleteAllCollections(adminDb, ["organizations"]);
  await firebase.auth().signOut();
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
        firebase
          .app()
          .functions(__functionsZone__)
          .httpsCallable(CloudFunction.CreateTestData)({
          organization: "default",
        })
      ).rejects.toThrow();

      // We log in with the wrong user
      await loginWithEmail("wrong@example.com");
      await expect(
        firebase
          .app()
          .functions(__functionsZone__)
          .httpsCallable(CloudFunction.CreateTestData)({
          organization: "default",
        })
      ).rejects.toThrow();

      // ...and with the right one
      await firebase.auth().signOut();
      await loginWithEmail("test@example.com");
      await firebase
        .app()
        .functions(__functionsZone__)
        .httpsCallable("createTestData")({
        organization: "default",
      });

      // or using the phone number
      await firebase.auth().signOut();
      await loginWithPhone("+1234567890");
      await firebase
        .app()
        .functions(__functionsZone__)
        .httpsCallable("createTestData")({
        organization: "default",
      });
    }
  );

  testWithEmulator("should respond if pinged", async (done) => {
    const result = await firebase
      .app()
      .functions(__functionsZone__)
      .httpsCallable(CloudFunction.Ping)({
      foo: "bar",
    });
    expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
    done();
  });
});
