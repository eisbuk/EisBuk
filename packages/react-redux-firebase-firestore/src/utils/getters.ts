export const getOrganization = () => {
  try {
    return localStorage.getItem("organization");
  } catch {
    return "test-organization";
  }
};
