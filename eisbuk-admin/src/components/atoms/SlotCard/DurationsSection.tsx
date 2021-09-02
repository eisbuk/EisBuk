import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Duration, Slot } from "eisbuk-shared";

import { slotsLabels } from "@/config/appConfig";

import {
  subscribeToSlot,
  unsubscribeFromSlot,
} from "@/store/actions/bookingOperations";

interface Props extends Slot<"id"> {
  /**
   * Duration of particular slot a customer is subscribed to.
   */
  subscribedDuration?: Duration;
  /**
   * Enable subscription actions only in customer view.
   * Disable otherwise (and render UI accordingly).
   */
  enableSubscription: boolean;
}

/**
 * Renders durations for slot and enables booking (if customer view).
 * All booking (slot subscription) action handlers are kept internally and dispatched directly to store.
 */
const DurationsSection: React.FC<Props> = ({
  subscribedDuration,
  enableSubscription,
  ...slotData
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { secretKey } = useParams<{ secretKey?: string }>();

  const classes = useStyles();

  /**
   * HOF that generates onClick handler for each duration.
   * - If duration subscribed to, removes subscription
   * - If not subscribed to given duration, toggles a subscription and removes subscription to any other duration from slot
   * @param duration duration for which to subscribe
   * @returns onClick handler
   */
  const handleSubscription = (duration: Duration) => () => {
    if (secretKey) {
      if (subscribedDuration === duration) {
        dispatch(unsubscribeFromSlot(secretKey!, slotData.id));
      } else {
        dispatch(subscribeToSlot(secretKey!, { ...slotData, duration }));
      }
    } else {
      console.error("Illegel operation, no secret key present");
    }
  };

  const durationButtons = (
    <ButtonGroup variant="text">
      {slotData.durations.map((duration) => {
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
