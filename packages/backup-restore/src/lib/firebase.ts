import admin from "firebase-admin";

export interface IServiceAccountJson {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
  private_key_id?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

interface Options {
  serviceAccount: IServiceAccountJson;
  useEmulator?: boolean;
  emulatorHost?: string;
}

/**
 * intializeApp - Wrapper for 'firebase-admin' init
 */
export function initializeApp({
  serviceAccount,
  useEmulator = false,
  emulatorHost = "localhost:8080",
}: Options): void {
  if (useEmulator) {
    process.env["FIRESTORE_EMULATOR_HOST"] = emulatorHost;
  }

  const { project_id, client_email, private_key } = serviceAccount;

  const credentials = useEmulator
    ? { projectId: project_id }
    : {
        credential: admin.credential.cert({
          projectId: project_id,
          clientEmail: client_email,
          privateKey: private_key,
        }),
      };

  admin.initializeApp(credentials);
}
