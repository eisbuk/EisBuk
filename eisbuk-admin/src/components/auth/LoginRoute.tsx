import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { PrivateRoutes, Routes } from "@/enums/routes";

import {
  getBookingsSecretKey,
  getIsAdmin,
  getIsAuthEmpty,
  getIsAuthLoaded,
} from "@/store/selectors/auth";

/**
 * Login route, checks for auth, if auth not provided, renders passed route props (LoginComponent)
 * If logged in, redirects to route "/" (DashboardComponent)
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const LoginRoute: React.FC<RouteProps> = (props) => {
  const isAuthEmpty = useSelector(getIsAuthEmpty);
  const isAuthLoaded = useSelector(getIsAuthLoaded);
  const isAdmin = useSelector(getIsAdmin);
  const secretKey = useSelector(getBookingsSecretKey);

  switch (true) {
    case !isAuthLoaded:
      return null;
    case isAuthEmpty:
      return <Route {...props} />;
    case isAdmin:
      return <Redirect to={PrivateRoutes.Root} />;
    case Boolean(secretKey):
      return <Redirect to={`${Routes.CustomerArea}/${secretKey}`} />;
    default:
      return <Redirect to={Routes.Unauthorized} />;
  }
};

export default LoginRoute;
