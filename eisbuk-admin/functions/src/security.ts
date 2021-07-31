import * as functions from "firebase-functions";
import admin from "firebase-admin";

/**
 * Admin authentication function
 */
export const amIAdmin = functions
  .region("europe-west6")
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      // fail early if no auth
      if (!auth) return { amIAdmin: false };

      const org = (
        await admin
          .firestore()
          .collection("organizations")
          .doc(organization)
          .get()
      ).data();

      const amIAdmin: boolean =
        org &&
        org.admins &&
        (org.admins.includes(auth.token.email) ||
          org.admins.includes(auth.token.phone_number));

      return { amIAdmin };
    }
  );
