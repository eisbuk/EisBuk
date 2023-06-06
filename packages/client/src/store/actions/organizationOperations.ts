import { Collection, OrganizationData } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification } from "@/features/notifications/actions";

import { doc, setDoc } from "@/utils/firestore";

const getOrganizationCollPath = () =>
  `${Collection.Organizations}/${getOrganization()}`;
export const updateOrganization =
  (
    orgData: OrganizationData,
    setSubmitting: (isSubmitting: boolean) => void
  ): FirestoreThunk =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();
      const docRef = doc(db, getOrganizationCollPath());

      await setDoc(docRef, orgData, { merge: true });

      dispatch(
        enqueueNotification({
          message: `${i18n.t(NotificationMessage.Updated)}`,
          variant: NotifVariant.Success,
        })
      );
      setSubmitting(false);
    } catch (error) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
    }
  };
