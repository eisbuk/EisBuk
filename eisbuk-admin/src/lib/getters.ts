import { __organization__ } from "@/lib/constants";

export const getOrganization = (): string => {
  // init organization with a hard coded fallback
  let organization = __organization__;

  try {
    // if in test environment using jest-dom (local storage)
    // try and read organziation from local storage
    const localStorageOrg = localStorage.getItem("organization");

    if (localStorageOrg) {
      organization = localStorageOrg;
    }
  } catch {
    //
  }

  return organization;
};
