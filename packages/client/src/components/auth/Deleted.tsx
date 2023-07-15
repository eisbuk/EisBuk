import React from "react";
import { useSelector } from "react-redux";
import _ from "lodash";

import { useTranslation, AuthMessage } from "@eisbuk/translations";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

import { getOrgEmail } from "@/store/selectors/orgInfo";

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
 * Displays "Deleted" message and logout button
 * @param param0 {backgroundIndex: index of the background to show, if not provided, picks at random}
 * @returns
 */
const Deleted: React.FC<Props> = ({ backgroundIndex }) => {
  const adminEmail = useSelector(getOrgEmail)!;

  const background = _.isNil(backgroundIndex)
    ? _.sample(backgrounds)
    : backgrounds[backgroundIndex % backgrounds.length];

  const style = {
    ...baseStyle,
    backgroundImage: `url(${background})`,
  };
  const { t } = useTranslation();

  return (
    <div className="content-container" style={style}>
      <h1 className="mt-4 mb-2 text-2xl text-gray-600">
        {t(AuthMessage.DeletedTitle)}
      </h1>
      {/* <h2 className="text-gray-500">{t(AuthMessage.AdminsOnly)}</h2> */}
      <h2 className="text-gray-500 text-lg mb-4">
        <b> {t(AuthMessage.DeletedSubtitle, { adminEmail })}</b>
      </h2>
    </div>
  );
};

export default Deleted;
