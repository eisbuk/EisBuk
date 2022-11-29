export const getEmailForSignIn = (): string =>
  localStorage.getItem("emailForSignIn") || "";
export const setEmailForSignIn = (email: string): void =>
  localStorage.setItem("emailForSignIn", email);
export const unsetEmailForSignIn = (): void =>
  localStorage.removeItem("emailForSignIn");
