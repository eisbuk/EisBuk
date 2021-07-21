import { ORGANIZATION } from "@/config/envInfo";
import { ReduxFirestoreQuerySetting } from "react-redux-firebase";

import { Collection, OrgSubCollection } from "@/enums/firestore";

// ***** Region Wrap Organization ***** //
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
    doc: ORGANIZATION,
    subcollections: [{ ...toWrap }],
  };
};
// ***** End Region Wrap Organization ***** //
