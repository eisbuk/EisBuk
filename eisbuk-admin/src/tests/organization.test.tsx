import { db, adminDb } from "./settings";
import { loginWithUser, loginWithPhone } from "./utils";

const maybeDescribe = process.env.FIRESTORE_EMULATOR_HOST
  ? describe
  : xdescribe;

maybeDescribe("Organization permissions", () => {
  it("let only admin access an organization data (by email)", async () => {
    const orgDefinition = {
      admins: ["test@example.com"],
    };
    await adminDb.collection("organizations").doc("default").set(orgDefinition);
    // We haven't logged in yet, so we won't be authorized access
    const defaultOrgDoc = db.collection("organizations").doc("default");
    let error;
    try {
      (await defaultOrgDoc.get()).data();
    } catch (e) {
      error = true;
    }
    expect(error).toBe(true);

    // After login we'll be able to read and write documents in our organization
    await loginWithUser("test@example.com");
    const org = (await defaultOrgDoc.get()).data();
    expect(org).toStrictEqual(orgDefinition);
    const subdoc = db
      .collection("organizations")
      .doc("default")
      .collection("any_collection")
      .doc("testdoc");
    await subdoc.set({ "I am": "deep" });
    const retrievedDoc = (await subdoc.get()).data();
    expect(retrievedDoc).toStrictEqual({ "I am": "deep" });
  });

  it("let admin access an organization data (by phone)", async () => {
    const orgDefinition = {
      admins: ["+1234567890"],
    };
    await adminDb
      .collection("organizations")
      .doc("withPhone")
      .set(orgDefinition);

    await loginWithPhone(orgDefinition.admins[0]);
    // After login we'll be able to read and write documents in our organization
    const org = (
      await db.collection("organizations").doc("withPhone").get()
    ).data();
    expect(org).toStrictEqual(orgDefinition);
    const subdoc = db
      .collection("organizations")
      .doc("withPhone")
      .collection("any_collection")
      .doc("testdoc");
    await subdoc.set({ "I am": "deep" });
    const retrievedDoc = (await subdoc.get()).data();
    expect(retrievedDoc).toStrictEqual({ "I am": "deep" });
  });
});
