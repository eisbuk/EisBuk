import React from "react";
import { useDispatch, useSelector } from "react-redux";
import _ from "lodash";

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { useTranslation, AuthMessage } from "@eisbuk/translations";

import { signOut } from "@/store/actions/authOperations";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

import { getLocalAuth } from "@/store/selectors/auth";

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
 * Displays "unauthorized" message and logout button
 * @param param0 {backgroundIndex: index of the background to show, if not provided, picks at random}
 * @returns
 */
const Unauthorized: React.FC<Props> = ({ backgroundIndex }) => {
  const dispatch = useDispatch();

  // this is asserted as non-null as it shouldn't be render
  // if user is not authentidated (user data doesn't exist)
  // but only if user is authenticated and not admin
  const userAuthData = useSelector(getLocalAuth)!;

  const background = _.isNil(backgroundIndex)
    ? _.sample(backgrounds)
    : backgrounds[backgroundIndex % backgrounds.length];

  const style = {
    ...baseStyle,
    backgroundImage: `url(${background})`,
  };

  const logOut = () => dispatch(signOut());
  const { t } = useTranslation();

  return (
    <Paper style={style}>
      <Typography component="h1" variant="h2">
        {t(AuthMessage.NotAuthorized)}
      </Typography>
      <Typography component="h2" variant="h4">
        {t(AuthMessage.AdminsOnly)}
      </Typography>
      <Typography component="h2" variant="h5">
        {t(AuthMessage.LoggedInWith)}{" "}
        <b>{userAuthData?.email || userAuthData?.phoneNumber || ""}</b>
      </Typography>

      <Button variant="contained" onClick={logOut}>
        {t(AuthMessage.TryAgain)}
      </Button>
    </Paper>
  );
};

export default Unauthorized;
