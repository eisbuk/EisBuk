/* eslint-disable import/namespace */
import React from "react";
import { DateTime } from "luxon";

import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";

import makeStyles from "@material-ui/core/styles/makeStyles";

import * as colors from "@material-ui/core/colors";

import { Category } from "eisbuk-shared";

import { getInitials } from "@/utils/helpers";

type CertColorHideTuple = ["primary" | "error" | undefined, boolean];

// For all available colors make a CSS class
const colorsDef = {};
// eslint-disable-next-line array-callback-return
Object.keys(colors).map((color) => {
  if (color !== "common") {
    colorsDef[color] = { backgroundColor: colors[color][900] };
    colorsDef[color + "500"] = { backgroundColor: colors[color][500] };
    colorsDef[color + "200"] = { backgroundColor: colors[color][200] };
    colorsDef[color + "A100"] = { backgroundColor: colors[color]["A100"] };
    colorsDef[color + "A200"] = { backgroundColor: colors[color]["A200"] };
  }
});

// Make styles using the contrast text as text color
const useStyles = makeStyles((theme) => {
  const res = {
    rounded: {
      borderRadius: "10px",
    },
  };
  Object.keys(colorsDef).map(
    (color) =>
      (res[color] = {
        ...colorsDef[color],
        color: theme.palette.getContrastText(colorsDef[color].backgroundColor),
      })
  );
  return res;
});

const avatarColors = Object.keys(colorsDef);
// Get the available classes we can use to get different colors

const getColor = ({ name, surname }: { name: string; surname: string }) => {
  const str = name + surname;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  h = h & h;
  h = Math.abs(h) % avatarColors.length;

  return avatarColors[h];
};

// ***** Region Main Component ***** //
interface Props {
  name: string;
  surname: string;
  category?: Category;
  certificateExpiration?: string;
  covidCertificateReleaseDate?: string;
  covidCertificateSuspended?: boolean;
  className?: string;
}

export const EisbukAvatar: React.FC<Props> = ({
  name,
  surname,
  className,
  category,
  certificateExpiration,
  covidCertificateReleaseDate,
  covidCertificateSuspended,
}) => {
  const classes = useStyles();

  const wrapAvatar = (el: JSX.Element): JSX.Element => {
    // get medical certificate data
    const luxonMedCertExpiration = DateTime.fromISO(
      certificateExpiration || ""
    );
    // if customer doesn't have medical certificate, should display warning the same as if certificate expired
    const untilCertExpiration =
      luxonMedCertExpiration.diffNow("days")?.days || -1;

    const [medCertColor, medCertHidden]: CertColorHideTuple =
      untilCertExpiration < 0
        ? ["error", false]
        : untilCertExpiration < 20
        ? ["primary", false]
        : [undefined, true];

    // get covid certificate data
    const luxonCovidCertDate = DateTime.fromISO(
      covidCertificateReleaseDate || ""
    );
    // elapsed days from covid certificate release date, fallback is -1: customer dosan't have a covid certificate (yet)
    const daysFromCovidCert = -luxonCovidCertDate.diffNow("days")?.days || -1;

    const [covidCertColor, covidCertHidden]: CertColorHideTuple =
      daysFromCovidCert < 0
        ? ["error", false]
        : covidCertificateSuspended
        ? ["primary", false]
        : [undefined, true];

    return (
      <Badge
        color={covidCertColor}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        invisible={covidCertHidden}
        badgeContent="c"
      >
        <Badge color={medCertColor} invisible={medCertHidden} badgeContent="!">
          {el}
        </Badge>
      </Badge>
    );
  };

  let variant: Parameters<typeof Avatar>[0]["variant"];
  let additionalClass = classes[getColor({ name, surname })];

  switch (category) {
    case Category.Competitive:
      variant = "square";
      break;
    case Category.PreCompetitive:
      variant = "rounded";
      additionalClass += " " + classes.rounded;
      break;
    default:
      variant = "circular";
      break;
  }
  return wrapAvatar(
    <Avatar className={`${className} ${additionalClass}`} variant={variant}>
      {getInitials(name, surname)}
    </Avatar>
  );
};

export default EisbukAvatar;
