/* eslint-disable import/no-duplicates */
import { deleteAllCollections, loginWithPhone } from "./utils";
import "./settings";
import { adminDb } from "./settings";
import firebase from "firebase/app";
import "firebase/functions";

beforeAll(async () => {
  await deleteAllCollections(adminDb, ["organizations"]);
  await firebase.auth().signOut();
});

describe("Cloud functions tests", () => {
  it("Can ping the functions", async (done) => {
    const result = await firebase.app().functions().httpsCallable("ping")({
      foo: "bar",
    });
    expect(result).toEqual({ data: { pong: true, data: { foo: "bar" } } });
    done();
  });

  it("responds whether the user is an admin or not in the given organization", async (done) => {
    await adminDb
      .collection("organizations")
      .doc("default")
      .set({
        admins: ["isanadmin@example.com"],
      });
    const res = await firebase.app().functions().httpsCallable("amIAdmin")({
      organization: "default",
    });
    expect(res.data).toEqual({ amIAdmin: false });
    await loginWithUser("isanadmin@example.com");
    const res2 = await firebase.app().functions().httpsCallable("amIAdmin")({
      organization: "default",
    });
    await expect(res2.data).toEqual({ amIAdmin: true });
    done();
  });

  it("Denies access to users not belonging to the organization", async (done) => {
    await adminDb
      .collection("organizations")
      .doc("default")
      .set({
        admins: ["test@example.com", "+1234567890"],
      });
    // We're not logged in yet, so this should throw
    await expect(
      firebase.app().functions().httpsCallable("createTestData")({
        organization: "default",
      })
    ).rejects.toThrow();

    // We log in with the wrong user
    await loginWithUser("wrong@example.com");
    await expect(
      firebase.app().functions().httpsCallable("createTestData")({
        organization: "default",
      })
    ).rejects.toThrow();

    // ...and with the right one
    await firebase.auth().signOut();
    await loginWithUser("test@example.com");
    await firebase.app().functions().httpsCallable("createTestData")({
      organization: "default",
    });

    // or using the phone number
    await firebase.auth().signOut();
    await loginWithPhone("+1234567890");
    await firebase.app().functions().httpsCallable("createTestData")({
      organization: "default",
    });
    done();
  });
});

const loginWithUser = async (email: string): Promise<void> => {
  try {
    await firebase.auth().createUserWithEmailAndPassword(email, "secret");
  } catch (e) {
    await firebase.auth().signInWithEmailAndPassword(email, "secret");
  }
};
