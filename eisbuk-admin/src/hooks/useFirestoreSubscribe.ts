import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { getCalendarDay } from "@/store/selectors/app";
import { getAmIAdmin } from "@/store/selectors/auth";

import { getMonthStr } from "@/utils/helpers";
import { wrapOrganization } from "@/utils/firestore";

/**
 * A hook we're using to abstract away firestore subscriptions
 * through `useFirestoreConnect`. The hook is in charge on all of the firestore subscriptions
 * with respect to authentication state.
 */
const useFirestoreSubscribe = (): void => {
  const currentDate = useSelector(getCalendarDay);

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
      doc: ORGANIZATION,
    },
    wrapOrganization({
      collection: OrgSubCollection.SlotsByDay,
      where: ["month", "in", monthsToQuery],
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
          where: [
            ["date", ">", currentDate.minus({ month: 1 }).toJSDate()],
            ["date", "<", currentDate.plus({ month: 1 }).toJSDate()],
          ],
        }),
      ]
    : [];

  useFirestoreConnect([...baseSubscriptions, ...adminSubscriptions]);
};

export default useFirestoreSubscribe;
