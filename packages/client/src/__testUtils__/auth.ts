import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export const signInEmail = async (
  auth: Auth,
  email: string,
  password: string
) => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch {
    return await signInWithEmailAndPassword(auth, email, password);
  }
};
