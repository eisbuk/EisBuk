import React from "react";
import { useDispatch, useSelector } from "react-redux";
import _ from "lodash";

import { useTranslation, AuthMessage } from "@eisbuk/translations";

import { signOut } from "@/store/actions/authOperations";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

import { getLocalAuth } from "@/store/selectors/auth";
import { Button } from "@eisbuk/ui";

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
    <div className="content-container" style={style}>
      <h1 className="mt-4 mb-2 text-2xl text-gray-600">
        {t(AuthMessage.NotAuthorized)}
      </h1>
      <h2 className="text-gray-500">{t(AuthMessage.AdminsOnly)}</h2>
      <p className="text-gray-500 mb-4">
        {t(AuthMessage.LoggedInWith)}{" "}
        <b>{userAuthData?.email || userAuthData?.phoneNumber || ""}</b>
      </p>

      <Button className="bg-cyan-700" onClick={logOut}>
        {t(AuthMessage.TryAgain)}
      </Button>
    </div>
  );
};

export default Unauthorized;
