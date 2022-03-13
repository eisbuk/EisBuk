export const getSecretKey = (): string =>
  localStorage.getItem("secretKey") || "";
export const setSecretKey = (secretKey: string): void =>
  localStorage.setItem("secretKey", secretKey);
export const unsetSecretKey = (): void => localStorage.removeItem("secretKey");

export const getEmailForSignIn = (): string =>
  localStorage.getItem("emailForSignIn") || "";
export const setEmailForSignIn = (email: string): void =>
  localStorage.setItem("emailForSignIn", email);
export const unsetEmailForSignIn = (): void =>
  localStorage.removeItem("emailForSignIn");
