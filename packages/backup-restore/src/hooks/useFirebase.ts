import fs from "fs/promises";
import type { Command } from "commander";

import { initializeApp, IServiceAccountJson } from "../lib/firebase";
import { paths } from "../lib/paths";

/**
 * Command preAction hook to initialises Firebase app using stored config.
 * Hook should be used before any commands which require a connection to a firestore instance (production or local)
 *
 * E.g:
 *  `command.hook("preAction", useFirebase).action(readFromDb)`
 */
export async function useFirebase(thisCommand: Command): Promise<void> {
  const {
    emulators: useEmulator,
    host: emulatorHost,
    project,
  } = thisCommand.opts();

  const serviceAccountPath = `${paths.data}/${project}-credentials.json`;

  try {
    const serviceAccountJson = await fs.readFile(serviceAccountPath, "utf-8");

    const serviceAccount = JSON.parse(
      serviceAccountJson
    ) as IServiceAccountJson;

    console.log("Initialising firebase...");
    console.log(`Connecting to ${project} firestore`);

    if (useEmulator) {
      console.log("Using emulators");
    }

    initializeApp({
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
