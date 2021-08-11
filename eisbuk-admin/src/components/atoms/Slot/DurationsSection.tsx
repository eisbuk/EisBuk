import React from "react";
import { useTranslation } from "react-i18next";

import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Duration } from "eisbuk-shared";

import { slotsLabels } from "@/config/appConfig";

interface DurationsProps {
  durations: Duration[];
  subscribedDuration?: Duration;
  enableSubscription?: boolean;
  handleSubscription: (duration: Duration) => () => void;
}

const DurationsSection: React.FC<DurationsProps> = ({
  durations,
  subscribedDuration,
  handleSubscription,
  enableSubscription,
}) => {
  const { t } = useTranslation();

  const classes = useStyles();

  const durationButtons = (
    <ButtonGroup variant="text">
      {durations.map((duration) => {
        const color =
          subscribedDuration === duration
            ? "primary"
            : enableSubscription
            ? "secondary"
            : undefined;

        return (
          <Button
            key={duration}
            color={color}
            {...(enableSubscription
              ? { onClick: handleSubscription(duration) }
              : { disabled: true })}
            className={classes.duration}
          >
            {slotsLabels.durations[duration].label}
          </Button>
        );
      })}
    </ButtonGroup>
  );

  const subscribedMessage = subscribedDuration ? (
    <>
      <CheckCircleIcon color="primary" fontSize="small" />
      <Typography className={classes.helpText}>{t("Slots.Booked")}</Typography>
    </>
  ) : (
    <>
      <ArrowBackIcon fontSize="small" />
      <Typography className={classes.helpText}>{t("Slots.Book")}</Typography>
    </>
  );

  return (
    <Box flexGrow={1} display="flex" alignItems="center">
      {durationButtons}
      {enableSubscription && subscribedMessage}
    </Box>
  );
};

const useStyles = makeStyles((theme) => ({
  duration: {
    "&.MuiButton-root.Mui-disabled.MuiButton-textPrimary": {
      color: theme.palette.primary.main,
    },
    borderColor: theme.palette.divider,
  },
  helpText: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
}));

export default DurationsSection;
