import React from "react";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";

import { Collection } from "eisbuk-shared";

import { Routes, PrivateRoutes } from "@/enums/routes";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Unauthorized from "@/components/auth/Unauthorized";
import LoginRoute from "@/components/auth/LoginRoute";
import DebugPage from "@/components/debugPage";

import DashboardPage from "@/pages/root";
import AthletesPage from "@/pages/customers";
import SlotsPage from "@/pages/slots";
import LoginPage from "@/pages/login";
import CustomerAreaPage from "@/pages/customer_area";
import AttendancePrintable from "@/pages/attendance_printable";
import FirestoreDebug from "@/pages/firestore_debug";

import useFirestoreSubscribe from "@/store/firestore/useFirestoreSubscribe";

import { getIsAuthLoaded, getIsAuthEmpty } from "@/store/selectors/auth";

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

  const subscribedCollections =
    isAuthLoaded && !isAuthEmpty ? [Collection.Organizations] : [];

  useFirestoreSubscribe(subscribedCollections);

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

        <Route
          path={`${Routes.CustomerArea}/:secretKey/:customerRoute?`}
          component={CustomerAreaPage}
        />
        <Route path={Routes.Unauthorized} component={Unauthorized} exact />
        <Route path={Routes.Debug} component={DebugPage} />
        <Route path={Routes.FirestoreDebug} component={FirestoreDebug} />
      </Switch>
    </BrowserRouter>
  );
};

export default AppContent;
