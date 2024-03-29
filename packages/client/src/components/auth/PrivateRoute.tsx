import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { Routes } from "@eisbuk/shared/ui";

import Loading from "./Loading";

import {
  getAllSecretKeys,
  getIsAdmin,
  getIsAuthEmpty,
  getIsAuthLoaded,
} from "@/store/selectors/auth";

/**
 * Wrapper around route component to isolate (add auth check to) private routes
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const PrivateRoute: React.FC<RouteProps> = (props) => {
  const isAuthEmpty = useSelector(getIsAuthEmpty);
  const isAdmin = useSelector(getIsAdmin);
  const isAuthLoaded = useSelector(getIsAuthLoaded);
  const secretKeys = useSelector(getAllSecretKeys) || [];

  switch (true) {
    // Display loading state until initial auth is loaded
    case !isAuthLoaded:
      return <Loading />;

    // Render admin route
    case isAdmin:
      return <Route {...props} />;

    // Render login route if no auth after initial load
    case isAuthEmpty:
      return <Redirect to={Routes.Login} />;

    // If there's only one secret key, (user is managing only one account) redirect to that account
    case secretKeys.length === 1:
      const [secretKey] = secretKeys as string[];
      return <Redirect to={[Routes.CustomerArea, secretKey].join("/")} />;

    // If there are multiple secret keys (user is managing multiple accounts), redirect to account selection page
    // Note: This is the private route - this should not affect the behaviour of routes like '/customer_area/:secretKey' or '/self_register'
    case secretKeys.length > 1:
      return <Redirect to={Routes.SelectAccount} />;

    // The auth exists - user exists in firebase auth, but there's no secret
    // key - redirect to complte registration
    default:
      return <Redirect to={Routes.SelfRegister} />;
  }
};

export default PrivateRoute;
