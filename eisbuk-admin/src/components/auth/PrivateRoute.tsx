import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { Routes } from "@/enums/routes";

import Unauthorized from "./Unauthorized";
// import Loading from "./Loading";

import { getFirebaseAuth, getAmIAdmin } from "@/store/selectors/auth";

import { isEmpty } from "@/temp/helpers";

/**
 * Wrapper around route component to isolate (add auth check to) private routes
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const PrivateRoute: React.FC<RouteProps> = (props) => {
  const auth = useSelector(getFirebaseAuth);

  const amIAdmin = useSelector(getAmIAdmin);

  /** @TODO update below when we update auth and `isloaded` / `isEmpty` helpers */
  switch (true) {
    // display loading state until auth is processed
    // case !isLoaded(auth):
    //   return <Loading />;

    // render admin route
    case amIAdmin && !isEmpty(auth):
      return <Route {...props} />;

    // render "unauthorized"
    case !amIAdmin && !isEmpty(auth):
      return <Unauthorized />;

    default:
      // if all else fails, redirect to `/login`
      return <Redirect to={Routes.Login} />;
  }
};

export default PrivateRoute;
