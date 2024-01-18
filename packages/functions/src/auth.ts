import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  AuthStatus,
  Collection,
  OrganizationData,
  OrgSubCollection,
  QueryAuthStatusPayload,
  wrapIter,
  DeprecatedAuthStatus,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";
import { checkRequiredFields } from "./utils";

/**
 * @deprecated This is hare for temporary backward compatibility, but is removed from
 * 'CloutFunction' enum and is not used in the updated version of the app.
 *
 * @TODO Remove this function after allowing some time for update.
 */
export const queryAuthStatus = functions
  .region(__functionsZone__)
  .https.onCall(
    async (payload: QueryAuthStatusPayload): Promise<DeprecatedAuthStatus> => {
      // validate payload
      checkRequiredFields(payload, ["organization", "authString"]);

      const { organization, authString } = payload;

      const authStatus: DeprecatedAuthStatus = {
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
    }
  );

/** @TODO Rename this to 'queryAuthStatus' once the deprecated function is removed. */
export const queryAuthStatus2 = functions
  .region(__functionsZone__)
  .https.onCall(
    async (payload: QueryAuthStatusPayload): Promise<AuthStatus> => {
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
      const secretKeys = wrapIter(customers.docs)
        .map((doc) => doc.data())
        // We're filtering instead of finding as auth user can be associated with multiple customers
        .filter(({ email, phone }) => [email, phone].includes(authString))
        .map(({ secretKey }) => secretKey)
        ._array();

      authStatus.secretKeys = secretKeys;

      return authStatus;
    }
  );
