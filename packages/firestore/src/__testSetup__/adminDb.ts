import { Firestore } from "@google-cloud/firestore";
import { credentials } from "@grpc/grpc-js";

/** @DELETE_THIS_COMMENT This is a quick copy/paste from @eisbuk/client I'm thinking we should create a central one in the future */
export const adminDb = new Firestore({
  options: {
    servicePath: "localhost",
    port: 8081,
    sslCreds: credentials.createInsecure(),
    customHeaders: {
      Authorization: "Bearer owner",
    },
  },
});
