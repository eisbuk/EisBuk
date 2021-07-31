import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";

import { Routes } from "@/enums/routes";

import Unauthorized from "./Unauthorized";
import Loading from "./Loading";

import { getFirebaseAuth, getLocalAuth } from "@/store/selectors/auth";

/**
 * Wrapper around route component to isolate (add auth check to) private routes
 * @param props `react-router-dom` RouteProps
 * @returns JSX.Element
 */
const PrivateRoute: React.FC<RouteProps> = (props) => {
  const auth = useSelector(getFirebaseAuth);
  const authInfoEisbuk = useSelector(getLocalAuth);

  const amIAdmin =
    authInfoEisbuk.amIAdmin && authInfoEisbuk.myUserId === auth.uid;

  switch (true) {
    // display loading state until auth is processed
    case !isLoaded(auth):
      return <Loading />;

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
