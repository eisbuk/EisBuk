import React from "react";
import { useTranslation } from "react-i18next";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import AcUnit from "@mui/icons-material/AcUnit";
import AccessibilityNew from "@mui/icons-material/AccessibilityNew";

import { SlotType } from "@eisbuk/shared";

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

  const Icon = iconLookup[type];

  return (
    <Box className={[classes.flexCenter, className].join(" ")}>
      <Icon className={classes.typeIcon} fontSize="small" />
      <Typography className={classes.type} key="type" color={colorLookup[type]}>
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
