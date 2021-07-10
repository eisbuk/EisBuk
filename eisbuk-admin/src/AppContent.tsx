import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  isLoaded,
  isEmpty,
  useFirestoreConnect,
  useFirestore,
} from "react-redux-firebase";
import { Route, Switch } from "react-router-dom";

import { LocalStore } from "@/types/store";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Unauthorized from "@/components/auth/Unauthorized";
import LoginRoute from "@/components/auth/LoginRoute";
import DebugPage from "@/components/debugPage";

import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import SlotsPage from "@/pages/SlotsPage";
import LoginPage from "@/pages/LoginPage";
import CustomerAreaPage from "@/pages/CustomerAreaPage";

import { wrapOrganization } from "@/utils/firestore";
import { getMonthStr } from "@/utils/helpers";

import { ORGANIZATION } from "@/config/envInfo";

import { calendarDaySelector } from "@/store/selectors";
import { queryUserAdminStatus } from "@/store/actions/actions";

/***** Region Safe Private Route *****/
enum PrivateRoutes {
  Root = "/",
  Atleti = "/atleti",
  Prenotazaioni = "/prenotazioni",
}

const PrivateRouteComponents = {
  [PrivateRoutes.Root]: DashboardPage,
  [PrivateRoutes.Atleti]: CustomersPage,
  [PrivateRoutes.Prenotazaioni]: SlotsPage,
};

/**
 * A type safe PrivateRoute wrapper, fixes return type from `JSX.Element | undefined` to `JSX.Element | null`
 * PrivateRoute component might work in practice, but TypeSrcipt complains because `undefined` is not a valid JSX.Elmenet
 * @param param0 path (one of the private route paths)
 * @returns PrivateRoute with provided componet for corresponding route if defined, if not defined, returns `null`
 */
const SafePrivateRoute = (path: PrivateRoutes) => {
  return (
    PrivateRoute({
      path,
      component: PrivateRouteComponents[path],
      exact: true,
    }) || null
  );
};
/***** End Region Safe Private Route *****/

/***** Region App Components *****/
/**
 * General components to be returned from the AppContent, regardless of auth status
 * @returns
 */
function AppComponents() {
  return (
    <Switch>
      <LoginRoute path="/login" component={LoginPage} />
      {SafePrivateRoute(PrivateRoutes.Root)}
      {SafePrivateRoute(PrivateRoutes.Atleti)}
      {SafePrivateRoute(PrivateRoutes.Prenotazaioni)}
      <Route path="/unauthorized" component={Unauthorized} exact />
      <Route path="/clienti/:secret_key" children={<CustomerAreaPage />} />
      <Route path="/debug" children={<DebugPage />} />
    </Switch>
  );
}
/***** End Region App Components *****/

/***** Region Authenticated Only *****/
/**
 * Components wrapper for authenticated user
 * Does additional Redux - Firestore connect for data available only to authenticated users
 * @returns
 */
function AppContentAuthenticated() {
  const currentDate = useSelector(calendarDaySelector);
  const firestore = useFirestore();

  const monthsToQuery = [
    getMonthStr(currentDate, -1),
    getMonthStr(currentDate, 0),
    getMonthStr(currentDate, 1),
  ];

  useFirestoreConnect([
    wrapOrganization({
      collection: "customers",
      orderBy: ["certificateExpiration", "asc"],
    }),
    wrapOrganization({
      collection: "slotsByDay",
      /** @TEMP below, investigate this later */
      where: [(firestore.FieldPath as any).documentId(), "in", monthsToQuery],
    }),
    wrapOrganization({
      collection: "bookingsByDay",
      /** @TEMP below, investigate this later */
      where: [(firestore.FieldPath as any).documentId(), "in", monthsToQuery],
    }),
    {
      collection: "organizations",
      doc: ORGANIZATION,
    },
  ]);
  return AppComponents();
}
/***** End Region Authenticated Only *****/

/***** Region Main Component *****/
/**
 * All of the App content (including routes) wrapper.
 * On change of auth credentials (and initial render)
 * checks auth credentials with Firebase.
 * If admin, returns `AppContentAuthenticated` wrapper (doing additional admin only opertions),
 * if not admin, returns `AppComponents` directly
 * @returns wrapper or components directly, both resulting if further rendering `AppComponents`
 */
function AppContent() {
  const auth = useSelector((state: LocalStore) => state.firebase.auth);
  const amIAdmin = useSelector(
    (state: LocalStore) => state.authInfoEisbuk.amIAdmin
  );
  const dispatch = useDispatch();

  // When auth changes this component fires a query to determine
  // whether the current user is an administrator.
  useEffect(() => {
    if (isLoaded(auth) && !isEmpty(auth)) {
      dispatch(queryUserAdminStatus());
    }
  }, [auth, dispatch]);

  if (isLoaded(auth) && !isEmpty(auth) && amIAdmin) {
    // The user is authenticated and is an admin: it makes sense to query
    // protected collections that are used all over the application
    return <AppContentAuthenticated />;
  } else {
    // Anonymous user: do not attempt to query collections that would fail with
    // unauthorized. Only render subcomponents
    return <AppComponents />;
  }
}

export default AppContent;
/***** Region Main Component *****/
