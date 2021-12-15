import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  UserCredential,
} from "@firebase/auth";
import axios from "axios";

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

/**
 * Test util: loggs in with phone number
 * @TODO this doesn't work for some reason in Node environment -> investigate further
 * @param phoneNumber
 * @returns
 */
export const loginWithPhone = async (
  phoneNumber: string
): Promise<UserCredential> => {
  // Turn off phone auth app verification.
  auth.settings.appVerificationDisabledForTesting = true;

  const verifier = new RecaptchaVerifier(
    document.createElement("div"),
    {},
    auth
  );
  jest
    .spyOn(verifier, "verify")
    .mockImplementation(() => Promise.resolve("foo"));
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    verifier
  );
  const response = await axios.get(
    "http://localhost:9098/emulator/v1/projects/eisbuk/verificationCodes"
  );
  let verificationCode = "foo";
  for (let i = 0; i < response.data.verificationCodes.length; i++) {
    const element = response.data.verificationCodes[i];
    if (element.phoneNumber === phoneNumber) {
      verificationCode = element.code;
    }
  }
  return confirmationResult.confirm(verificationCode);
};
