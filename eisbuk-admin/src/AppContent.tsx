import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  isLoaded,
  isEmpty,
  useFirestoreConnect,
  useFirestore,
} from "react-redux-firebase";
import { Route, Switch } from "react-router-dom";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { Routes, PrivateRoutes } from "@/enums/routes";

import { LocalStore } from "@/types/store";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Unauthorized from "@/components/auth/Unauthorized";
import LoginRoute from "@/components/auth/LoginRoute";
import DebugPage from "@/components/debugPage";

import DashboardPage from "@/pages/DashboardPage";
import AthletesPage from "@/pages/CustomersPage";
import SlotsPage from "@/pages/SlotsPage";
import LoginPage from "@/pages/LoginPage";
import CustomerAreaPage from "@/pages/CustomerAreaPage";
import CustomersPage from "@/pages/customers";

import { wrapOrganization } from "@/utils/firestore";
import { getMonthStr } from "@/utils/helpers";

import { ORGANIZATION } from "@/config/envInfo";

import { queryOrganizationStatus } from "@/store/actions/authOperations";
import { getCalendarDay } from "@/store/selectors/app";
import { getAmIAdmin } from "@/store/selectors/auth";

// ***** Region App Components ***** //
/**
 * General components to be returned from the AppContent, regardless of auth status
 * @returns
 */
const AppComponents: React.FC = () => {
  return (
    <Switch>
      <LoginRoute path={Routes.Login} component={LoginPage} />
      <PrivateRoute exact path={PrivateRoutes.Root} component={DashboardPage} />
      <PrivateRoute path={PrivateRoutes.Atleti} component={AthletesPage} />
      <PrivateRoute path={PrivateRoutes.Prenotazioni} component={SlotsPage} />
      <PrivateRoute
        path={`${PrivateRoutes.Customers}/:secretKey/:customerRoute?/:date?`}
        component={CustomersPage}
      />
      <Route path={Routes.Unauthorized} component={Unauthorized} exact />
      <Route path={Routes.Clienti} children={<CustomerAreaPage />} />
      <Route path={Routes.Debug} children={<DebugPage />} />
    </Switch>
  );
};
// ***** End Region App Components ***** //

// ***** Region Authenticated Only ***** //
/**
 * Components wrapper for authenticated user
 * Does additional Redux - Firestore connect for data available only to authenticated users
 * @returns
 */
const AppContentAuthenticated: React.FC = () => {
  const currentDate = useSelector(getCalendarDay);
  const firestore = useFirestore();

  const monthsToQuery = [
    getMonthStr(currentDate, -1),
    getMonthStr(currentDate, 0),
    getMonthStr(currentDate, 1),
  ];

  useFirestoreConnect([
    wrapOrganization({
      collection: OrgSubCollection.Customers,
      orderBy: ["certificateExpiration", "asc"],
    }),
    wrapOrganization({
      collection: OrgSubCollection.SlotsByDay,
      /** @TEMP below, investigate this later */
      where: [(firestore.FieldPath as any).documentId(), "in", monthsToQuery],
    }),
    wrapOrganization({
      collection: OrgSubCollection.BookingsByDay,
      /** @TEMP below, investigate this later */
      where: [(firestore.FieldPath as any).documentId(), "in", monthsToQuery],
    }),
    {
      collection: Collection.Organizations,
      doc: ORGANIZATION,
    },
  ]);
  return <AppComponents />;
};
// ***** End Region Authenticated Only ***** //

// ***** Region Main Component ***** //
/**
 * All of the App content (including routes) wrapper.
 * On change of auth credentials (and initial render)
 * checks auth credentials with Firebase.
 * If admin, returns `AppContentAuthenticated` wrapper (doing additional admin only opertions),
 * if not admin, returns `AppComponents` directly
 * @returns wrapper or components directly, both resulting if further rendering `AppComponents`
 */
const AppContent: React.FC = () => {
  const auth = useSelector((state: LocalStore) => state.firebase.auth);
  const amIAdmin = useSelector(getAmIAdmin);
  const dispatch = useDispatch();

  // When auth changes this component fires a query to determine
  // whether the current user is an administrator.
  useEffect(() => {
    if (isLoaded(auth) && !isEmpty(auth)) {
      dispatch(queryOrganizationStatus());
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
};

export default AppContent;
// ***** Region Main Component ***** //
