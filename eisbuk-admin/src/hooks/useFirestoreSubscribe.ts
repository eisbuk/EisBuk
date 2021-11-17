import { useSelector } from "react-redux";
import { useFirestoreConnect, useFirestore } from "react-redux-firebase";

import { Collection, luxon2ISODate, OrgSubCollection } from "eisbuk-shared";

import { getCalendarDay } from "@/store/selectors/app";
import { getAmIAdmin } from "@/store/selectors/auth";

import { getMonthStr } from "@/utils/helpers";
import { getOrganization } from "@/lib/getters";
import { wrapOrganization } from "@/utils/firestore";

/**
 * A hook we're using to abstract away firestore subscriptions
 * through `useFirestoreConnect`. The hook is in charge on all of the firestore subscriptions
 * with respect to authentication state.
 */
const useFirestoreSubscribe = (): void => {
  const currentDate = useSelector(getCalendarDay);
  const firestore = useFirestore();

  const monthsToQuery = [
    getMonthStr(currentDate, -1),
    getMonthStr(currentDate, 0),
    getMonthStr(currentDate, 1),
  ];

  /**
   * Subscriptions active regardless of auth state
   */
  const baseSubscriptions = [
    {
      collection: Collection.Organizations,
      doc: getOrganization(),
    },
    wrapOrganization({
      collection: OrgSubCollection.SlotsByDay,
      /** @TEMP below, investigate this later */
      where: [(firestore.FieldPath as any).documentId(), "in", monthsToQuery],
    }),
  ];

  const amIAdmin = useSelector(getAmIAdmin);

  /**
   * Subscriptions available only to authenticated admin.
   * If admin authenticated subscribes to appropriate firestore records,
   * else falls back to empty array (no subscriptions)
   */
  const adminSubscriptions = amIAdmin
    ? [
        wrapOrganization({
          collection: OrgSubCollection.Customers,
          orderBy: ["certificateExpiration", "asc"],
        }),
        wrapOrganization({
          collection: OrgSubCollection.Attendance,
          /** @TEMP below, investigate this later */
          where: [
            ["date", ">", luxon2ISODate(currentDate.minus({ months: 1 }))],
            ["date", "<", luxon2ISODate(currentDate.plus({ months: 1 }))],
          ],
        }),
      ]
    : [];

  useFirestoreConnect([...baseSubscriptions, ...adminSubscriptions]);
};

export default useFirestoreSubscribe;
