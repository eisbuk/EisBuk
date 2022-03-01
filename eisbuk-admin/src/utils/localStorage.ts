export const getSecretKey = (): string =>
  localStorage.getItem("secretKey") || "";

export const setSecretKey = (secretKey: string): void =>
  localStorage.setItem("secretKey", secretKey);

export const unsetSecretKey = (): void => localStorage.removeItem("secretKey");
