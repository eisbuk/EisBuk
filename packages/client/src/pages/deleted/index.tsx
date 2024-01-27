import React from "react";
import { useSelector } from "react-redux";
import _ from "lodash";
import { Redirect } from "react-router-dom";

import { useTranslation, AuthMessage } from "@eisbuk/translations";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";
import { OrgSubCollection } from "@eisbuk/shared";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

import { getOrgEmail } from "@/store/selectors/orgInfo";
import { getBookingsCustomer } from "@/store/selectors/bookings";

import useSecretKey from "@/hooks/useSecretKey";

import { getOrganization } from "@/lib/getters";
import { Routes } from "@eisbuk/shared/ui";

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
 * @param props {backgroundIndex: index of the background to show, if not provided, picks at random}
 * @returns
 */
const Deleted: React.FC<Props> = ({ backgroundIndex }: Props) => {
  const { t } = useTranslation();

  const adminEmail = useSelector(getOrgEmail)!;

  const secretKey = useSecretKey();
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Bookings, meta: { secretKey } },
  ]);
  const customer = useSelector(getBookingsCustomer);

  // If customer's not deleted - you shouldn't be here
  // If there's no customer - the customer is either not yet loaded, or not found - both are valid reasons to stick around
  if (customer && !customer.deleted) {
    return <Redirect to={[Routes.CustomerArea, secretKey].join("/")} />;
  }

  const background = _.isNil(backgroundIndex)
    ? _.sample(backgrounds)
    : backgrounds[backgroundIndex % backgrounds.length];

  const style = {
    ...baseStyle,
    backgroundImage: `url(${background})`,
  };

  return (
    <div className="content-container" style={style}>
      <h1 className="mt-4 mb-2 text-2xl text-gray-500 select-none">
        {t(AuthMessage.DeletedTitle)}
      </h1>
      <h2
        dangerouslySetInnerHTML={{
          __html: t(AuthMessage.DeletedSubtitle, { adminEmail }),
        }}
        className="text-gray-500 text-lg mb-4 select-none"
      ></h2>
    </div>
  );
};

export default Deleted;
