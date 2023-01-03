import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { useSelector } from "react-redux";

import { Routes } from "@/enums/routes";

import Unauthorized from "./Unauthorized";
import Loading from "./Loading";

import {
  getBookingsSecretKey,
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
  const secretKey = useSelector(getBookingsSecretKey);

  switch (true) {
    // Display loading state until initial auth is loaded
    case !isAuthLoaded:
      return <Loading />;

    // Render admin route
    case isAdmin:
      return <Route {...props} />;

    // Render login route if no auth loaded
    case isAuthEmpty:
      return <Redirect to={Routes.Login} />;

    // If auth not empty (auth user exists), and there's no secret key (registration is not completed -> customer is not created in firestore)
    // redirect to self registration form
    case !isAuthEmpty && !secretKey:
      return <Redirect to={Routes.SelfRegister} />;

    // Render "unauthorized"
    default:
      return <Unauthorized />;
  }
};

export default PrivateRoute;
