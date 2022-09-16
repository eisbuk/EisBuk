import React from "react";
import { Route, Switch } from "react-router-dom";
import { useSelector } from "react-redux";

import { Collection, OrgSubCollection } from "@eisbuk/shared";
import {
  CollectionSubscription,
  usePaginateFirestore,
  useFirestoreSubscribe,
} from "@eisbuk/react-redux-firebase-firestore";

import { Routes, PrivateRoutes } from "@/enums/routes";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Unauthorized from "@/components/auth/Unauthorized";
import NotRegistered from "@/components/auth/NotRegistered";
import LoginRoute from "@/components/auth/LoginRoute";

import AttendancePage from "@/pages/attendance";
import AthletesPage from "@/pages/customers";
import SlotsPage from "@/pages/slots";
import LoginPage from "@/pages/login";
import CustomerAreaPage from "@/pages/customer_area";
import AttendancePrintable from "@/pages/attendance_printable";
import DebugPage from "@/pages/debug";
import AdminPreferencesPage from "@/pages/admin_preferences";

import { getIsAdmin } from "@/store/selectors/auth";

/**
 * All of the App content (including routes) wrapper.
 * On change of auth credentials (and initial render)
 * checks auth credentials with Firebase.
 * If admin, returns `AppContentAuthenticated` wrapper (doing additional admin only opertions),
 * if not admin, returns `AppComponents` directly
 * @returns wrapper or components directly, both resulting if further rendering `AppComponents`
 */
const AppContent: React.FC = () => {
  const isAdmin = useSelector(getIsAdmin);

  const subscribedCollections: CollectionSubscription[] = isAdmin
    ? [Collection.Organizations, OrgSubCollection.Customers]
    : [];

  useFirestoreSubscribe(subscribedCollections);
  usePaginateFirestore();

  return (
    <Switch>
      <LoginRoute path={Routes.Login} component={LoginPage} />
      <PrivateRoute
        exact
        path={PrivateRoutes.Root}
        component={AttendancePage}
      />
      <PrivateRoute path={PrivateRoutes.Athletes} component={AthletesPage} />
      <PrivateRoute path={PrivateRoutes.Slots} component={SlotsPage} />
      <PrivateRoute
        path={Routes.AttendancePrintable}
        component={AttendancePrintable}
      />
      <PrivateRoute
        path={PrivateRoutes.AdminPreferences}
        component={AdminPreferencesPage}
      />

      <Route
        path={`${Routes.CustomerArea}/:secretKey`}
        component={CustomerAreaPage}
      />
      <Route path={Routes.Unauthorized} component={Unauthorized} exact />
      <Route path={Routes.NotRegistered} component={NotRegistered} exact />
      <Route path={Routes.Debug} component={DebugPage} />
    </Switch>
  );
};

export default AppContent;
