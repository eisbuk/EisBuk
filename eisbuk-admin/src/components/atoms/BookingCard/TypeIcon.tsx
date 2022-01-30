import React from "react";
import { useTranslation } from "react-i18next";

import Box, { BoxProps } from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";
import createStyles from "@material-ui/core/styles/createStyles";

import { SlotType } from "eisbuk-shared";

import { slotsLabels } from "@/config/appConfig";

import { SlotTypeLabel } from "@/enums/translations";

import ProjectIcon from "@/components/global/ProjectIcons";

interface Props extends BoxProps {
  type: SlotType;
}

const TypeIcon: React.FC<Props> = ({ type, className: rootClasses }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const slotLabel = slotsLabels.types[type];

  return (
    <Box className={[rootClasses, classes.flexCenter].join(" ")}>
      <ProjectIcon
        className={classes.typeIcon}
        icon={slotLabel.icon}
        fontSize="small"
      />
      <Typography className={classes.type} key="type" color={slotLabel.color}>
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

export default TypeIcon;
