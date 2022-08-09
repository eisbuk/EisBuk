const isTest = process.env.NODE_ENV === "test";

let _organization = isTest ? "test-organization" : "";
let _organizationRegistered = isTest ? true : false;

export const registerOrganization = (organization: string) => {
  _organization = organization;
  _organizationRegistered = true;
};

export const getOrganization = () => {
  if (_organizationRegistered) return _organization;
  throw new Error("Organization not registered");
};
