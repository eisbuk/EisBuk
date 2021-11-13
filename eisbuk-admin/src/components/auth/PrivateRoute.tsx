import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { Routes } from "@/enums/routes";

import Unauthorized from "./Unauthorized";
import Loading from "./Loading";

import {
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

  /** @TODO update below when we update auth and `isloaded` / `isEmpty` helpers */
  switch (true) {
    // display loading state until initial auth is loaded
    case !isAuthLoaded:
      return <Loading />;

    // render admin route
    case isAdmin:
      return <Route {...props} />;

    // render "unauthorized"
    case !isAdmin && !isAuthEmpty:
      return <Unauthorized />;

    default:
      // if all else fails, redirect to `/login`
      return <Redirect to={Routes.Login} />;
  }
};

export default PrivateRoute;
