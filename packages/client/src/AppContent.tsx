import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { useSelector } from "react-redux";

import { Collection, OrgSubCollection } from "@eisbuk/shared";
import { Routes, PrivateRoutes } from "@eisbuk/shared/ui";
import {
  CollectionSubscription,
  usePaginateFirestore,
  useFirestoreSubscribe,
} from "@eisbuk/react-redux-firebase-firestore";

import { getOrganization } from "@/lib/getters";

import PrivateRoute from "@/components/auth/PrivateRoute";
import Deleted from "@/components/auth/Deleted";
import LoginRoute from "@/components/auth/LoginRoute";

import AttendancePage from "@/pages/attendance";
import AthletesPage from "@/pages/customers";
import AthleteProfilePage from "@/pages/athlete_profile";
import ErrorBoundaryPage from "@/pages/error_boundary";
import SlotsPage from "@/pages/slots";
import LoginPage from "@/pages/login";
import CustomerAreaPage from "@/pages/customer_area";
import AttendancePrintable from "@/pages/attendance_printable";
import DebugPage from "@/pages/debug";
import AdminPreferencesPage from "@/pages/admin_preferences";
import SelfRegister from "@/pages/self_register";

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
    ? [
        { collection: Collection.Organizations },
        { collection: OrgSubCollection.Customers },
        { collection: Collection.PublicOrgInfo },
      ]
    : [{ collection: Collection.PublicOrgInfo }];

  useFirestoreSubscribe(getOrganization(), subscribedCollections);
  usePaginateFirestore();

  return (
    <Switch>
      <LoginRoute path={Routes.Login} component={LoginPage} />
      <PrivateRoute
        exact
        path={PrivateRoutes.Root}
        component={AttendancePage}
      />
      <PrivateRoute
        exact
        path={PrivateRoutes.Athletes}
        component={AthletesPage}
      />
      <PrivateRoute
        exact
        path={PrivateRoutes.NewAthlete}
        component={AthleteProfilePage}
      />
      <PrivateRoute
        path={`${PrivateRoutes.Athletes}/:athlete`}
        component={AthleteProfilePage}
      />
      <PrivateRoute path={PrivateRoutes.Slots} component={SlotsPage} />
      <PrivateRoute
        path={Routes.AttendancePrintable}
        component={AttendancePrintable}
      />
      <PrivateRoute
        path={PrivateRoutes.AdminPreferences}
        component={AdminPreferencesPage}
      />

      <PrivateRoute
        // Private route is a hack here...if visiting '/customer_area' without a secret key,
        // if will handle all cases of auth/non-auth/auth-but-not-registered appropriately.
        //
        // For admin, however, after they pass the PrivateRoute checks, they will be redirected to
        // '/athletes' page (from where they can redirect to the correct customer area - for a given customer)
        path={Routes.CustomerArea}
        exact={true}
      >
        <Redirect to={PrivateRoutes.Athletes} />
      </PrivateRoute>
      <Route
        path={`${Routes.CustomerArea}/:secretKey`}
        component={CustomerAreaPage}
      />
      <Route exact path={Routes.ErrorBoundary} component={ErrorBoundaryPage} />
      <Route path={Routes.SelfRegister} component={SelfRegister} exact />
      <Route path={Routes.Debug} component={DebugPage} />
      <Route path={Routes.Deleted} component={Deleted} />
    </Switch>
  );
};

export default AppContent;
