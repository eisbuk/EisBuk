import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { PrivateRoutes, Routes } from "@eisbuk/shared/ui";

import {
  getBookingsSecretKey,
  getIsAdmin,
  getIsAuthEmpty,
  getIsAuthLoaded,
} from "@/store/selectors/auth";
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
  const isAdmin = useSelector(getIsAdmin);
  const secretKey = useSelector(getBookingsSecretKey);

  switch (true) {
    // Loading screen
    case !isAuthLoaded:
      return <Loading />;
    // If auth empty, show login/register screen
    case isAuthEmpty:
      return <Route {...props} />;
    // If admin, redirect to root page (attendance view)
    case isAdmin:
      return <Redirect to={PrivateRoutes.Root} />;
    // If not admin, but has 'secretKey' redirect to customer area
    case Boolean(secretKey):
      return <Redirect to={`${Routes.CustomerArea}/${secretKey}`} />;
    // Default: auth user exists, but is not admin nor is registered (doesn't have a 'secretKey'):
    // Redirect to self registration form
    default:
      return <Redirect to={Routes.SelfRegister} />;
  }
};

export default LoginRoute;
