import React from "react";
import { useTranslation } from "react-i18next";

import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import makeStyles from "@material-ui/core/styles/makeStyles";
import createStyles from "@material-ui/core/styles/createStyles";

import AcUnit from "@material-ui/icons/AcUnit";
import AccessibilityNew from "@material-ui/icons/AccessibilityNew";

import { SlotType } from "eisbuk-shared";

import { SlotTypeLabel } from "@/enums/translations";

const iconLookup = {
  [SlotType.Ice]: AcUnit,
  [SlotType.OffIce]: AccessibilityNew,
};

const colorLookup: Record<SlotType, "primary" | "secondary"> = {
  [SlotType.Ice]: "primary",
  [SlotType.OffIce]: "secondary",
};

const SlotTypeIcon: React.FC<{ type: SlotType; className?: string }> = ({
  type,
  className = "",
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  /** This is @TEMP until all deprecated types are migrated to unified off-ice */
  const slotType = type.includes("off-ice") ? SlotType.OffIce : type;
  /** This is @TEMP until all deprecated types are migrated to unified off-ice */

  const Icon = iconLookup[slotType];

  return (
    <Box className={[classes.flexCenter, className].join(" ")}>
      <Icon className={classes.typeIcon} fontSize="small" />
      <Typography
        className={classes.type}
        key="type"
        color={colorLookup[slotType]}
      >
        {t(SlotTypeLabel[type])}
      </Typography>
    </Box>
  );
};

const useStyles = makeStyles((theme) =>
  createStyles({
    typeIcon: {
      opacity: 0.5,
    },
    type: {
      textTransform: "uppercase",
      // @ts-expect-error - fontWeightBold has the wrong type for some reason
      fontWeight: theme.typography.fontWeightBold,
      fontSize: theme.typography.pxToRem(10),
    },
    flexCenter: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  })
);

export default SlotTypeIcon;
