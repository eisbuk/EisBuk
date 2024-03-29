import React from "react";
import _ from "lodash";

import { ReactComponent as FigureSkatingSilhouetteCouple } from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import { ReactComponent as FigureSkatingSilhouetteSkirt } from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import { ReactComponent as FigureSkatingSilhouette } from "@/assets/images/login/figure-skating-silhouette.svg";
import { ReactComponent as GirlIceSkating } from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import { ReactComponent as IceSkatingSilhouette } from "@/assets/images/login/ice-skating-silhouette.svg";

import AuthDialog from "@/react-redux-firebase-auth/ui/AuthDialog";
import { useSelector } from "react-redux";
import { getOrgDisplayName } from "@/store/selectors/orgInfo";

const loginBackgrounds = [
  <FigureSkatingSilhouetteCouple />,
  <FigureSkatingSilhouetteSkirt />,
  <FigureSkatingSilhouette />,
  <GirlIceSkating />,
  <IceSkatingSilhouette />,
];

const LoginImage = () => _.sample(loginBackgrounds) || null;

const SignInSide: React.FC = () => {
  const displayName = useSelector(getOrgDisplayName);

  return (
    <main className="content-container h-screen grid grid-cols-12">
      <div className="max-h-screen hidden md:block md:col-span-5 lg:col-span-7">
        <LoginImage />
      </div>
      <div className="col-span-12 px-16 py-32 flex flex-col items-center shadow-[1px_1px_2px_#0000] md:col-span-7 lg:col-span-5">
        <h1 className="h-10 mb-6 font-fredoka font-semibold text-3xl text-black text-center">
          {displayName}
        </h1>
        <AuthDialog />
      </div>
    </main>
  );
};

export default SignInSide;
