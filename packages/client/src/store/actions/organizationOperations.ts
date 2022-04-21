import { doc, getFirestore, setDoc } from "@firebase/firestore";

import { Collection, OrganizationData } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

const getOrganizationCollPath = () =>
  `${Collection.Organizations}/${getOrganization()}`;

export const updateOrganization =
  (
    orgData: OrganizationData,
    setSubmitting: (isSubmitting: boolean) => void
  ): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const docRef = doc(db, getOrganizationCollPath());

      await setDoc(docRef, orgData, { merge: true });

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
      dispatch(showErrSnackbar);
    }
  };
