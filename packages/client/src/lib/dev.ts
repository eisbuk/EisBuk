import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "@firebase/auth";

import { CloudFunction } from "@eisbuk/shared/ui";

import { __isDev__ } from "./constants";

import { auth, functions } from "@/setup";

import { createFunctionCaller } from "@/utils/firebase";

/**
 * Creates a new (dummy) organization in firestore
 * and populates it with two dummy (admin) users
 * @returns
 */
export const initDev = async (): Promise<void> => {
  if (!__isDev__) {
    throw new Error("This function is only available in development mode");
  }
  await createFunctionCaller(functions, CloudFunction.CreateOrganization, {
    displayName: "EisBuk Dev",
  })();
  // Auth emulator is not currently accessible from within the functions
  try {
    await createUserWithEmailAndPassword(auth, "test@eisbuk.it", "test00");
  } catch (e) {
    await signInWithEmailAndPassword(auth, "test@eisbuk.it", "test00");
  }
};
