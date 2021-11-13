import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { PrivateRoutes } from "@/enums/routes";

import { getIsAuthEmpty } from "@/store/selectors/auth";

/**
 * Login route, checks for auth, if auth not provided, renders passed route props (LoginComponent)
 * If logged in, redirects to route "/" (DashboardComponent)
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const LoginRoute: React.FC<RouteProps> = (props) => {
  const isAuthEmpty = useSelector(getIsAuthEmpty);
  const isAuthLoaded = useSelector(getIsAuthEmpty);

  return (
    <>
      {isAuthLoaded && isAuthEmpty && <Route {...props} />}
      {isAuthLoaded && !isAuthEmpty && <Redirect to={PrivateRoutes.Root} />}
    </>
  );
};

export default LoginRoute;
