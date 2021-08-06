import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Paper, Typography } from "@material-ui/core";
import _ from "lodash";
import { useTranslation } from "react-i18next";

import { signOut } from "@/store/actions/authOperations";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

import { getFirebaseAuth } from "@/store/selectors/auth";

// ***** Region Background Images ***** //
const backgrounds = [
  figureSkatingSilhouetteCouple,
  figureSkatingSilhouetteSkirt,
  figureSkatingSilhouette,
  girlIceSkating,
  iceSkatingSilhouette,
];
// ***** End Region Background Images ***** //

// ***** Region Styles ***** //
/** @TODO refactor to use className instead of inline stlye */
const baseStyle = {
  backgroundRepeat: "no-repeat",
  backgroundOpacity: "20%",
  backgroundSize: "contain",
  backgroundPosition: "center",
  height: "100vh",
};
// ***** End Region Styles ***** //

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

  const auth = useSelector(getFirebaseAuth);

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
        {t("Authorization.NotAuthorized")}
      </Typography>
      <Typography component="h2" variant="h4">
        {t("Authorization.AdminsOnly")}
      </Typography>
      <Typography component="h2" variant="h5">
        {t("Authorization.LoggedInWith")}{" "}
        <b>{auth.email || auth.phoneNumber}</b>
      </Typography>

      <Button variant="contained" onClick={logOut}>
        {t("Authorization.TryAgain")}
      </Button>
    </Paper>
  );
};

export default Unauthorized;
