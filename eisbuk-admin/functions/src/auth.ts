import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  AuthStatus,
  Collection,
  OrganizationData,
  OrgSubCollection,
} from "eisbuk-shared";

import { __functionsZone__ } from "./constants";
import { checkRequiredFields } from "./utils";

export const queryAuthStatus = functions
  .region(__functionsZone__)
  .https.onCall(async (payload) => {
    // validate payload
    checkRequiredFields(payload, ["organization", "authString"]);

    const { organization, authString } = payload;

    const authStatus: AuthStatus = {
      isAdmin: false,
    };

    const orgRef = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization);
    const customersRef = orgRef.collection(OrgSubCollection.Customers);

    const [org, customers] = await Promise.all([
      orgRef.get(),
      customersRef.get(),
    ]);

    // query admin status
    const orgData = org.data() as OrganizationData;
    if (orgData) {
      authStatus.isAdmin = orgData.admins.includes(authString);
    }

    // query customer status
    const authCustomer = customers.docs.find((customerDoc) => {
      const data = customerDoc.data();
      return data.email === authString || data.phone === authString;
    });
    if (authCustomer) {
      authStatus.bookingsSecretKey = authCustomer.data().secretKey;
    }

    return authStatus;
  });
