export const getOrganization = (): string => {
  try {
    return localStorage.getItem("organization") || "test-organization";
  } catch {
    return "test-organization";
  }
};
