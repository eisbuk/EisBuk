import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";
import { Route, Switch } from "react-router-dom";

import { Routes, PrivateRoutes } from "@/enums/routes";

import { LocalStore } from "@/types/store";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Unauthorized from "@/components/auth/Unauthorized";
import LoginRoute from "@/components/auth/LoginRoute";
import DebugPage from "@/components/debugPage";

import DashboardPage from "@/pages/root";
import AthletesPage from "@/pages/CustomersPage";
import SlotsPage from "@/pages/slots";
import LoginPage from "@/pages/LoginPage";
import CustomerAreaPage from "@/pages/customer_area";
import AttendancePrintable from "@/pages/attendance_printable";
import FirestoreDebug from "@/pages/firestore_debug";

import useFirestoreSubscribe from "@/hooks/useFirestoreSubscribe";

import { queryOrganizationStatus } from "@/store/actions/authOperations";

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
  const dispatch = useDispatch();

  // When auth changes this component fires a query to determine
  // whether the current user is an administrator.
  useEffect(() => {
    if (isLoaded(auth) && !isEmpty(auth)) {
      dispatch(queryOrganizationStatus());
    }
  }, [auth, dispatch]);

  useFirestoreSubscribe();

  return (
    <Switch>
      <LoginRoute path={Routes.Login} component={LoginPage} />
      <PrivateRoute exact path={PrivateRoutes.Root} component={DashboardPage} />
      <PrivateRoute path={PrivateRoutes.Atleti} component={AthletesPage} />
      <PrivateRoute path={PrivateRoutes.Prenotazioni} component={SlotsPage} />
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
  );
};

export default AppContent;
