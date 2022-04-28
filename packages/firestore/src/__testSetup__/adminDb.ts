import { Firestore } from "@google-cloud/firestore";
import { credentials } from "@grpc/grpc-js";

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
