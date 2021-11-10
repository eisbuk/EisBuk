import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { PrivateRoutes } from "@/enums/routes";

import { getFirebaseAuth } from "@/store/selectors/auth";

import { isEmpty } from "@/temp/helpers";

/**
 * Login route, checks for auth, if auth not provided, renders passed route props (LoginComponent)
 * If logged in, redirects to route "/" (DashboardComponent)
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const LoginRoute: React.FC<RouteProps> = (props) => {
  const auth = useSelector(getFirebaseAuth);

  /** @TODO update below when we update `isLoaded`/`isEmpty` */
  return (
    <>
      {isEmpty(auth) && <Route {...props} />}
      {!isEmpty(auth) && <Redirect to={PrivateRoutes.Root} />}
    </>
    // <>
    //   {isLoaded(auth) && isEmpty(auth) && <Route {...props} />}
    //   {isLoaded(auth) && !isEmpty(auth) && <Redirect to={PrivateRoutes.Root} />}
    // </>
  );
};

export default LoginRoute;
