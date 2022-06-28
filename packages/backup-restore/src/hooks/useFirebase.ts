import fs from "fs/promises";

import { initializeApp, IServiceAccountJson } from "../lib/firebase";
import { configstore } from "../config/configstore";
import { paths } from "../config/paths";

/**
 * Command preAction hook to initialises Firebase app using stored config.
 * Hook should be used before any commands which require a connection to a firestore instance (production or local)
 *
 * E.g:
 *  `command.hook("preAction", useFirebase).action(readFromDb)`
 */
export async function useFirebase(): Promise<void> {
  const { useEmulators, emulatorHost, activeProject } = configstore.all;

  const useEmulator = useEmulators === "true";
  const serviceAccountPath = `${paths.data}/${activeProject}.json`;

  try {
    const serviceAccountJson = await fs.readFile(serviceAccountPath, "utf-8");

    const serviceAccount = JSON.parse(
      serviceAccountJson
    ) as IServiceAccountJson;

    console.log("Initialising firebase...");
    console.log(`Connecting to ${activeProject} firestore`);

    if (useEmulator) {
      console.log("Using emulators");
    }

    await initializeApp({
      serviceAccount,
      useEmulator,
      emulatorHost,
    });
    return;
  } catch (err: any) {
    console.error(err);
    return;
  }
}
