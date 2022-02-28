import React from "react";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { Routes, PrivateRoutes } from "@/enums/routes";

import { CollectionSubscription } from "@/types/store";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Unauthorized from "@/components/auth/Unauthorized";
import LoginRoute from "@/components/auth/LoginRoute";

import DashboardPage from "@/pages/root";
import AthletesPage from "@/pages/customers";
import SlotsPage from "@/pages/slots";
import LoginPage from "@/pages/login";
import CustomerAreaPage from "@/pages/customer_area";
import AttendancePrintable from "@/pages/attendance_printable";
import DebugPage from "@/pages/debug";

import usePaginateFirestore from "@/react-redux-firebase/hooks/usePaginateFirestore";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { getIsAuthLoaded, getIsAuthEmpty } from "@/store/selectors/auth";
import AdminPreferencesPage from "./pages/admin_preferences";
import { DateTime } from "luxon";

/**
 * All of the App content (including routes) wrapper.
 * On change of auth credentials (and initial render)
 * checks auth credentials with Firebase.
 * If admin, returns `AppContentAuthenticated` wrapper (doing additional admin only opertions),
 * if not admin, returns `AppComponents` directly
 * @returns wrapper or components directly, both resulting if further rendering `AppComponents`
 */
const AppContent: React.FC = () => {
  const isAuthLoaded = useSelector(getIsAuthLoaded);
  const isAuthEmpty = useSelector(getIsAuthEmpty);

  const subscribedCollections: CollectionSubscription[] =
    isAuthLoaded && !isAuthEmpty
      ? [Collection.Organizations, OrgSubCollection.Customers]
      : [];

  useFirestoreSubscribe(subscribedCollections);
  usePaginateFirestore();

  console.log("Date:", DateTime.now().toISODate());

  return (
    <BrowserRouter>
      <Switch>
        <LoginRoute path={Routes.Login} component={LoginPage} />
        <PrivateRoute
          exact
          path={PrivateRoutes.Root}
          component={DashboardPage}
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
          path={`${Routes.CustomerArea}/:secretKey/:customerRoute?`}
          component={CustomerAreaPage}
        />
        <Route path={Routes.Unauthorized} component={Unauthorized} exact />
        <Route path={Routes.Debug} component={DebugPage} />
      </Switch>
    </BrowserRouter>
  );
};

export default AppContent;
