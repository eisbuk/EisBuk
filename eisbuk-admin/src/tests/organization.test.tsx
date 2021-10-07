import { Collection } from "eisbuk-shared";
import { setDoc, getDoc, doc } from "firebase/firestore";

import { db, adminDb } from "./settings";
import { loginWithUser, loginWithPhone } from "./utils";

const maybeDescribe = process.env.FIRESTORE_EMULATOR_HOST
  ? describe
  : xdescribe;

maybeDescribe("Organization permissions", () => {
  xit("let only admin access an organization data (by email)", async () => {
    const orgDefinition = {
      admins: ["test@example.com"],
    };
    /** @TEMP Check this firestore setup */
    await setDoc(
      doc(adminDb as any, `${Collection.Organizations}/default`),
      orgDefinition
    );
    // We haven't logged in yet, so we won't be authorized access
    const defaultOrgDoc = doc(db, `${Collection.Organizations}/default`);

    let error;
    try {
      (await getDoc(defaultOrgDoc)).data();
    } catch (e) {
      error = true;
    }
    expect(error).toBe(true);

    // After login we'll be able to read and write documents in our organization
    await loginWithUser("test@example.com");
    const org = (await getDoc(defaultOrgDoc)).data();
    expect(org).toStrictEqual(orgDefinition);
    const subdoc = doc(
      db,
      `${Collection.Organizations}/default/any_collection/testdoc`
    );
    await setDoc(subdoc, { "I am": "deep" });
    const retrievedDoc = (await getDoc(subdoc)).data();
    expect(retrievedDoc).toStrictEqual({ "I am": "deep" });
  });

  xit("let admin access an organization data (by phone)", async () => {
    const orgDefinition = {
      admins: ["+1234567890"],
    };
    /** @TEMP Check this firestore setup */
    await setDoc(
      doc(adminDb as any, `${Collection.Organizations}/withPhone`),
      orgDefinition
    );

    await loginWithPhone(orgDefinition.admins[0]);
    // After login we'll be able to read and write documents in our organization
    const org = (
      await getDoc(doc(db, `${Collection.Organizations}/withPhone`))
    ).data();
    expect(org).toStrictEqual(orgDefinition);
    const subdoc = doc(
      db,
      `${Collection.Organizations}/withPhone/any_collection/testdoc`
    );
    await setDoc(subdoc, { "I am": "deep" });
    const retrievedDoc = (await getDoc(subdoc)).data();
    expect(retrievedDoc).toStrictEqual({ "I am": "deep" });
  });
});
