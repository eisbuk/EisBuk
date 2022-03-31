import { doc, getFirestore, setDoc } from "@firebase/firestore";
import i18n from "i18next";

import { Collection, OrganizationData } from "@eisbuk/shared";
import { FirestoreThunk } from "@/types/store";
import { enqueueNotification, showErrSnackbar } from "./appActions";

import { NotifVariant } from "@/enums/store";

import { NotificationMessage } from "@/enums/translations";
import { __organization__ } from "@/lib/constants";

const getOrganizationCollPath = () =>
  `${Collection.Organizations}/${__organization__}`;

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
