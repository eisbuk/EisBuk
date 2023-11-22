import { normalizeEmail } from "@eisbuk/shared";
export const getEmailForSignIn = (): string =>
  localStorage.getItem("emailForSignIn") || "";
export const setEmailForSignIn = (email: string): void =>
  localStorage.setItem("emailForSignIn", normalizeEmail(email));
export const unsetEmailForSignIn = (): void =>
  localStorage.removeItem("emailForSignIn");
