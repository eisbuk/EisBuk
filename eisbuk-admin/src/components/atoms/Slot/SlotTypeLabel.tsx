import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import AcUnit from "@material-ui/icons/AcUnit";
import AccessibilityNew from "@material-ui/icons/AccessibilityNew";
import FitnessCenter from "@material-ui/icons/FitnessCenter";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotType } from "eisbuk-shared";

import { SvgProps } from "@/types/components";

import { slotsLabels } from "@/config/appConfig";

interface Props {
  slotType: SlotType;
}

const SlotTypeLabel: React.FC<Props> = ({ slotType }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const slotLabel = slotsLabels.types[slotType];

  return (
    <Box display="flex" alignItems="center" pl={1} pr={1}>
      <Icon className={classes.typeIcon} slotType={slotType} fontSize="small" />
      <Typography className={classes.type} key="type" color={slotLabel.color}>
        {t(`SlotTypes.${slotType}`)}
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

const useStyles = makeStyles((theme) => ({
  typeIcon: {
    opacity: 0.5,
  },
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
}));

export default SlotTypeLabel;
