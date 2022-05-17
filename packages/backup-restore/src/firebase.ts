import admin, { ServiceAccount } from "firebase-admin";

interface Options {
  serviceAccount: ServiceAccount;
  useEmulator?: boolean;
  emulatorHost?: string;
}

/**
 * intializeApp - Wrapper for 'firebase-admin' init
 */
export function initializeApp({
  serviceAccount,
  useEmulator = false,
  emulatorHost = "localhost:8081",
}: Options): void {
  if (useEmulator) {
    process.env["FIRESTORE_EMULATOR_HOST"] = emulatorHost;
  }

  const credentials = useEmulator
    ? { projectId: serviceAccount.projectId }
    : { credential: admin.credential.cert(serviceAccount) };

  admin.initializeApp(credentials);
}
