import React from "react";
import { useDispatch, useSelector } from "react-redux";
import _ from "lodash";
import { useTranslation } from "react-i18next";

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { AuthMessage } from "@eisbuk/translations";

import { Routes } from "@/enums/routes";

import { signOut } from "@/store/actions/authOperations";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

import { getLocalAuth, getIsAuthEmpty } from "@/store/selectors/auth";
import { Redirect } from "react-router-dom";

// #region backgroundImages
const backgrounds = [
  figureSkatingSilhouetteCouple,
  figureSkatingSilhouetteSkirt,
  figureSkatingSilhouette,
  girlIceSkating,
  iceSkatingSilhouette,
];
// #endregion backgroundImages

// #region styles
/** @TODO refactor to use className instead of inline stlye */
const baseStyle = {
  backgroundRepeat: "no-repeat",
  backgroundOpacity: "20%",
  backgroundSize: "contain",
  backgroundPosition: "center",
  height: "100vh",
};
// #endregion styles

interface Props {
  backgroundIndex?: number;
}

/**
 * Displays "not-registered" message and logout button
 * @param param0 {backgroundIndex: index of the background to show, if not provided, picks at random}
 * @returns
 */
const Unauthorized: React.FC<Props> = ({ backgroundIndex }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const userAuthData = useSelector(getLocalAuth);
  const isAuthEmpty = useSelector(getIsAuthEmpty);

  const background = _.isNil(backgroundIndex)
    ? _.sample(backgrounds)
    : backgrounds[backgroundIndex % backgrounds.length];

  const style = {
    ...baseStyle,
    backgroundImage: `url(${background})`,
  };

  const logOut = () => dispatch(signOut());

  let authMethod;
  let authString;
  const organizationEmail = "test@email.com";
  if (userAuthData?.email) {
    authMethod = "email";
    authString = userAuthData.email;
  } else if (userAuthData?.phoneNumber) {
    authMethod = "phone";
    authString = userAuthData.phoneNumber;
  }

  return (
    <>
      {isAuthEmpty && <Redirect to={Routes.Login} />}
      <Paper style={style}>
        <Typography component="h1" variant="h2">
          {t(AuthMessage.NotRegistered)}
        </Typography>
        <Typography component="h2" variant="h4">
          {t(AuthMessage.ContactAdminsForRegistration, {
            authMethod,
            authString,
            organizationEmail,
          })}
        </Typography>

        <Button variant="contained" onClick={logOut}>
          {t(AuthMessage.TryAgain)}
        </Button>
      </Paper>
    </>
  );
};

export default Unauthorized;
