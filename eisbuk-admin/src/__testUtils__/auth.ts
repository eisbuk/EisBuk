import firebase from "firebase/app";
import axios from "axios";

/**
 * Test util: loggs in with default user's email ("test@example.com")
 * @returns
 */
export const loginDefaultUser = (): Promise<void> => {
  return loginWithEmail("test@example.com");
};

/**
 * @param email
 */
export const loginWithEmail = async (email: string): Promise<void> => {
  try {
    await firebase.auth().createUserWithEmailAndPassword(email, "secret");
  } catch (e) {
    await firebase.auth().signInWithEmailAndPassword(email, "secret");
  }
};

/**
 * Test util: loggs in with phone number
 * @param phoneNumber
 * @returns
 */
export const loginWithPhone = async (
  phoneNumber: string
): Promise<firebase.auth.UserCredential> => {
  // Turn off phone auth app verification.
  firebase.auth().settings.appVerificationDisabledForTesting = true;

  const verifier = new firebase.auth.RecaptchaVerifier(
    document.createElement("div")
  );
  jest
    .spyOn(verifier, "verify")
    .mockImplementation(() => Promise.resolve("foo"));
  const confirmationResult = await firebase
    .auth()
    .signInWithPhoneNumber(phoneNumber, verifier);
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
