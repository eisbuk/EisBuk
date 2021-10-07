import {
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";

import { adminDb, auth, functions } from "./settings";

import { deleteAllCollections, loginWithPhone } from "./utils";

beforeAll(async () => {
  await deleteAllCollections(adminDb, ["organizations"]);
  await signOut(auth);
});

const maybeDescribe = process.env.FIRESTORE_EMULATOR_HOST
  ? describe
  : xdescribe;

maybeDescribe("Cloud functions", () => {
  xit("can be pinged", async (done) => {
    const result = httpsCallable(
      functions,
      "ping"
    )({
      foo: "bar",
    });
    expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
    done();
  });

  xit("denies access to users not belonging to the organization", async (done) => {
    await adminDb
      .collection("organizations")
      .doc("default")
      .set({
        admins: ["test@example.com", "+1234567890"],
      });
    // We're not logged in yet, so this should throw
    await expect(
      httpsCallable(
        functions,
        "createTestData"
      )({
        organization: "default",
      })
    ).rejects.toThrow();

    // We log in with the wrong user
    await loginWithUser("wrong@example.com");
    await expect(
      httpsCallable(
        functions,
        "createTestData"
      )({
        organization: "default",
      })
    ).rejects.toThrow();

    // ...and with the right one
    await signOut(auth);
    await loginWithUser("test@example.com");
    await httpsCallable(
      functions,
      "createTestData"
    )({
      organization: "default",
    });

    // or using the phone number
    await signOut(auth);
    await loginWithPhone("+1234567890");
    await httpsCallable(
      functions,
      "createTestData"
    )({
      organization: "default",
    });
    done();
  });
});

const loginWithUser = async (email: string): Promise<void> => {
  try {
    await createUserWithEmailAndPassword(auth, email, "secret");
  } catch (e) {
    await signInWithEmailAndPassword(auth, email, "secret");
  }
};
