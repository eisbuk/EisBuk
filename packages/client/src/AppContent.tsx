import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { useSelector } from "react-redux";

import { Collection, OrgSubCollection } from "@eisbuk/shared";
import { Routes, PrivateRoutes } from "@eisbuk/shared/ui";
import { DevWarning } from "@eisbuk/ui";
import {
  CollectionSubscription,
  usePaginateFirestore,
  useFirestoreSubscribe,
} from "@eisbuk/react-redux-firebase-firestore";

import { __isDevStrict__ } from "@/lib/constants";

import { getOrganization } from "@/lib/getters";

import PrivateRoute from "@/components/auth/PrivateRoute";
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
import PrivacyPolicy from "@/pages/privacy_policy";
import Deleted from "@/pages/deleted";

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

  // Remove the firestore emulator warning as it's in the way.
  // We're adding a warning of our own, incorporated nicely into out layout
  React.useEffect(() => {
    document.querySelector("p.firebase-emulator-warning")?.remove();
  }, []);

  // We're showing the emulators warning strictly in "development" mode,
  // not in test mode (which can loosely be considered dev mode) so as to not obscure the
  // parts of the UI in cypress tests.
  const showEmulatorsWarining = __isDevStrict__;

  return (
    <>
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
        <Route
          exact
          path={Routes.ErrorBoundary}
          component={ErrorBoundaryPage}
        />
        <Route path={Routes.SelfRegister} component={SelfRegister} exact />
        <PrivateRoute path={Routes.Debug} component={DebugPage} />
        <Route
          exact
          path={Routes.Deleted}
          component={() => <Redirect to="/" />}
        />
        <Route path={`${Routes.Deleted}/:secretKey`} component={Deleted} />
        <Route path={Routes.PrivacyPolicy} component={PrivacyPolicy} />
      </Switch>

      <div className="fixed z-50 bottom-1 left-1/2 -translate-x-1/2 content-container text-center">
        <DevWarning open={showEmulatorsWarining} />
      </div>
    </>
  );
};

export default AppContent;
