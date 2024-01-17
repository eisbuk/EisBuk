import "source-map-support/register";

import admin from "firebase-admin";

admin.initializeApp();

export * from "./dataTriggers";
export * from "./migrations";
export * from "./testData";
export * from "./testSlots";
export * from "./https";
export * from "./auth";
export * from "./checks/https";

export * from "./sendEmail";
export * from "./sendSMS";
