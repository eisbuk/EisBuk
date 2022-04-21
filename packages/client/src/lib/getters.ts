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

  /**
   * @TEMP replace `igoriceteam` with `igorice` in order to use the old organization entry (igorice)
   * with new domain name (igoriceteam), until we migrate the organization entries to `igoriceteam`.
   */
  organization = organization.replace(/igoriceteam/i, "igorice");

  return organization;
};
