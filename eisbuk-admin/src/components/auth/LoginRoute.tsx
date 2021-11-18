import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { PrivateRoutes } from "@/enums/routes";

import { getIsAuthEmpty, getIsAuthLoaded } from "@/store/selectors/auth";

/**
 * Login route, checks for auth, if auth not provided, renders passed route props (LoginComponent)
 * If logged in, redirects to route "/" (DashboardComponent)
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const LoginRoute: React.FC<RouteProps> = (props) => {
  const isAuthEmpty = useSelector(getIsAuthEmpty);
  const isAuthLoaded = useSelector(getIsAuthLoaded);

  console.log("Is auth Empty > ", isAuthEmpty);
  console.log("Is auth Loaded > ", isAuthLoaded);

  switch (true) {
    case isAuthLoaded && isAuthEmpty:
      return <Route {...props} />;
    case isAuthLoaded && !isAuthEmpty:
      console.log("Redirecting...");
      return <Redirect to={PrivateRoutes.Root} />;
    default:
      return null;
  }
};

export default LoginRoute;
