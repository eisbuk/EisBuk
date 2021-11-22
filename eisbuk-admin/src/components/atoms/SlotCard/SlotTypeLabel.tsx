import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import AcUnit from "@material-ui/icons/AcUnit";
import AccessibilityNew from "@material-ui/icons/AccessibilityNew";
import FitnessCenter from "@material-ui/icons/FitnessCenter";

import makeStyles from "@material-ui/core/styles/makeStyles";
import createStyles from "@material-ui/core/styles/createStyles";

import { SlotType } from "eisbuk-shared";

import { SlotTypeLabel as Translation } from "@/enums/translations";

import { SvgProps } from "@/types/components";

import { slotsLabels } from "@/config/appConfig";

interface Props {
  slotType: SlotType;
}

/**
 * Small presentational component, used to render icon and appropriately styled label for slot type.
 * Gets passed `slotType` {`ice` | `off-ice-dancing` | `off-ice-gym`} as prop.
 */
const SlotTypeLabel: React.FC<Props> = ({ slotType }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const slotLabel = slotsLabels.types[slotType];

  return (
    <Box display="flex" alignItems="center" pl={1} pr={1}>
      <Icon className={classes.typeIcon} slotType={slotType} fontSize="small" />
      <Typography className={classes.type} key="type" color={slotLabel.color}>
        {t(Translation[slotType])}
      </Typography>
    </Box>
  );
};

interface IconProps extends SvgProps {
  slotType: SlotType;
}

/**
 * Shows an icon passed as prop and applies MUI Svg props (if any passed)
 * @param param0 icon, ...props (MUI Svg props)
 * @returns
 */
const Icon: React.FC<IconProps> = ({ slotType, ...props }) => {
  switch (slotType) {
    case SlotType.Ice:
      return <AcUnit {...props} />;
    case SlotType.OffIceDancing:
      return <AccessibilityNew {...props} />;
    case SlotType.OffIceGym:
      return <FitnessCenter {...props} />;
    default:
      return null;
  }
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
  })
);

export default SlotTypeLabel;
