import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from "@firebase/auth";

import { auth } from "@/__testSetup__/firestoreSetup";
import { defaultUser } from "@/__testSetup__/envData";

/* Test util: loggs in with default user's email ("test@example.com")
 * @returns
 */
export const loginDefaultUser = (): Promise<UserCredential> => {
  return signInWithEmailAndPassword(
    auth,
    defaultUser.email,
    defaultUser.password
  );
};

/**
 * @param email
 */
export const loginWithEmail = async (email: string): Promise<void> => {
  try {
    await createUserWithEmailAndPassword(auth, email, "secret");
  } catch (e) {
    await signInWithEmailAndPassword(auth, email, "secret");
  }
};
