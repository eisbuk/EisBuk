import { db, adminDb } from "./settings";
import { loginWithUser, loginWithPhone } from "./utils";

it("lets only admin access an organization data (by email)", async () => {
  const orgDefinition = {
    admins: ["test@example.com"],
  };
  await adminDb.collection("organizations").doc("default").set(orgDefinition);
  // We haven't logged in yet, so we won't be authorized access
  const default_org_doc = db.collection("organizations").doc("default");
  var error;
  try {
    (await default_org_doc.get()).data();
  } catch (e) {
    error = true;
  }
  expect(error).toBe(true);

  // After login we'll be able to read and write documents in our organization
  await loginWithUser("test@example.com");
  const org = (await default_org_doc.get()).data();
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

it("lets admin access an organization data (by phone)", async () => {
  const orgDefinition = {
    admins: ["+1234567890"],
  };
  await adminDb.collection("organizations").doc("withPhone").set(orgDefinition);

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
