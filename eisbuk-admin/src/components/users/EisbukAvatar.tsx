/* eslint-disable import/namespace */
import React from "react";
import { Avatar, Badge } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as colors from "@material-ui/core/colors";
import { DateTime } from "luxon";

import { Category } from "@/enums/firestore";

import { getInitials } from "@/utils/helpers";

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
  className?: string;
}

export const EisbukAvatar: React.FC<Props> = ({
  name,
  surname,
  className,
  category,
  certificateExpiration,
}) => {
  const classes = useStyles();
  let wrapAvatar = (el: JSX.Element) => el;

  try {
    const daysToExpiration = DateTime.fromISO(certificateExpiration!).diffNow(
      "days"
    ).days;
    if (daysToExpiration < 0) {
      // Certificate is expired
      wrapAvatar = (children) => (
        <Badge color="error" badgeContent="!">
          {children}
        </Badge>
      );
    } else if (daysToExpiration < 20) {
      // Certificate is about to expire
      wrapAvatar = (children) => <Badge color="primary">{children}</Badge>;
    }
  } catch (err) {
    console.error(err);
  }

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
