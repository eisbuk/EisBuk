import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { PrivateRoutes } from "@eisbuk/shared/ui";

import { getIsAuthEmpty, getIsAuthLoaded } from "@/store/selectors/auth";
import Loading from "./Loading";

/**
 * Login route, checks for auth, if auth not provided, renders passed route props (LoginComponent)
 * If logged in, redirects to route "/" (DashboardComponent)
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const LoginRoute: React.FC<RouteProps> = (props) => {
  const isAuthEmpty = useSelector(getIsAuthEmpty);
  const isAuthLoaded = useSelector(getIsAuthLoaded);

  switch (true) {
    // Loading screen
    case !isAuthLoaded:
      return <Loading />;
    // If auth empty, show login/register screen
    case isAuthEmpty:
      return <Route {...props} />;
    // If auth exists, redirect to the default route
    // Any further redirect will be handled by the PrivateRoute component there
    default:
      return <Redirect to={PrivateRoutes.Root} />;
  }
};

export default LoginRoute;
