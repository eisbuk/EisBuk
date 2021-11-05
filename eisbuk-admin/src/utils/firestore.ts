import { __organization__ } from "@/lib/constants";
import { ReduxFirestoreQuerySetting } from "react-redux-firebase";

import { Collection, OrgSubCollection } from "eisbuk-shared";

// #region WrapOrganization
type EnumSafeQuerySetting = Omit<ReduxFirestoreQuerySetting, "collection"> & {
  collection: OrgSubCollection;
};

interface WrapOrganization {
  (toWrap: EnumSafeQuerySetting): ReduxFirestoreQuerySetting;
}

/**
 * Wraps organization entry in "organizations" collection,
 * used to create a query setting for useFirestoreConnect (redux-firebase)
 * @param toWrap organization entry
 * @returns
 */
export const wrapOrganization: WrapOrganization = (toWrap) => {
  return {
    collection: Collection.Organizations,
    storeAs: toWrap.storeAs || toWrap.collection,
    doc: __organization__,
    subcollections: [{ ...toWrap }],
  };
};
// #endregion WrapOrganization
