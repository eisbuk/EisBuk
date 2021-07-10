import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";

import { LocalStore } from "@/types/store";

const authSelector = (state: LocalStore) => state.firebase.auth;

const LoginRoute: React.FC = (props) => {
  const auth = useSelector(authSelector);

  return (
    <>
      {isLoaded(auth) && isEmpty(auth) && <Route {...props} />}
      {isLoaded(auth) && !isEmpty(auth) && <Redirect to="/" />}
    </>
  );
};

export default LoginRoute;
