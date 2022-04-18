import { doc, getFirestore, setDoc } from "@firebase/firestore";

import { Collection, OrganizationData } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

const getOrganizationCollPath = () =>
  `${Collection.Organizations}/${getOrganization()}`;
const getPublicOrganizationInfoCollPath = () =>
  `${Collection.PublicOrgInfo}/${getOrganization()}`;
export const updateOrganization =
  (
    orgData: OrganizationData,
    setSubmitting: (isSubmitting: boolean) => void
  ): FirestoreThunk =>
  async (dispatch) => {
    try {
      const { displayName, location, emailFrom } = orgData;
      const db = getFirestore();
      const docRef = doc(db, getOrganizationCollPath());
      const publicOrgInfoDocRef = doc(db, getPublicOrganizationInfoCollPath());

      await setDoc(docRef, orgData, { merge: true });
      await setDoc(
        publicOrgInfoDocRef,
        { displayName, location, emailFrom },
        { merge: true }
      );

      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: `${i18n.t(NotificationMessage.Updated)}`,
          options: {
            variant: NotifVariant.Success,
          },
          closeButton: true,
        })
      );
      setSubmitting(false);
    } catch (error) {
      console.log({ error });
      dispatch(showErrSnackbar);
    }
  };
