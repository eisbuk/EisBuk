import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";

import { PrivateRoutes } from "@/enums/routes";

import { getFirebaseAuth } from "@/store/selectors/auth";

/**
 * Login route, checks for auth, if auth not provided, renders passed route props (LoginComponent)
 * If logged in, redirects to route "/" (DashboardComponent)
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const LoginRoute: React.FC<RouteProps> = (props) => {
  const auth = useSelector(getFirebaseAuth);

  return (
    <>
      {isLoaded(auth) && isEmpty(auth) && <Route {...props} />}
      {isLoaded(auth) && !isEmpty(auth) && <Redirect to={PrivateRoutes.Root} />}
    </>
  );
};

export default LoginRoute;
