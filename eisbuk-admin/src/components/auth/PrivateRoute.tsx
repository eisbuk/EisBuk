import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";

import Unauthorized from "./Unauthorized";
import Loading from "./Loading";

const PrivateRoute: React.FC = (props) => {
  const auth = useSelector((state) => state.firebase.auth);
  const authInfoEisbuk = useSelector((state) => state.authInfoEisbuk);
  const amIAdmin =
    authInfoEisbuk.amIAdmin && authInfoEisbuk.myUserId === auth.uid;

  if (isLoaded(auth) && isEmpty(auth)) {
    return <Redirect to="/login" />;
  } else if (!isLoaded(auth) || authInfoEisbuk.myUserId === null) {
    return <Loading />;
  } else if (amIAdmin && !isEmpty(auth)) {
    return <Route {...props} />;
  } else if (!amIAdmin && !isEmpty(auth)) {
    return <Unauthorized />;
  }
};

export default PrivateRoute;
