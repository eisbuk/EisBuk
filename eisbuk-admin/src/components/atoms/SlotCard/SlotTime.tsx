import React from "react";
import { DateTime } from "luxon";

import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { DeprecatedDuration as Duration } from "eisbuk-shared/dist/enums/deprecated/firestore";

interface SlotTimeProps {
  subscribedDuration?: Duration;
  startTime: DateTime;
}

/**
 * Presentational component used to move slot time dispay out of main component (for readability).
 * Gets passed start time and subscribed duration (if any).
 */
const SlotTime: React.FC<SlotTimeProps> = ({
  subscribedDuration,
  startTime,
}) => {
  const classes = useStyles();

  return (
    <Box p={1} flexShrink={0} className={classes.slotTime}>
      <Typography
        key="start"
        display="inline"
        variant="h5"
        component="h2"
        color={subscribedDuration ? "primary" : "initial"}
      >
        <strong>{startTime.toISOTime().substring(0, 5)}</strong>
      </Typography>
      {subscribedDuration && (
        <Typography
          key="end"
          display="inline"
          variant="h6"
          component="h3"
          className={classes.endTime}
        >
          {" "}
          -{" "}
          {startTime
            .plus({ minutes: Number(subscribedDuration) })
            .minus({ minutes: 10 })
            .toISOTime()
            .substring(0, 5)}
        </Typography>
      )}
    </Box>
  );
};

const useStyles = makeStyles((theme) => ({
  slotTime: {
    borderRightWidth: 1,
    borderRightColor: theme.palette.divider,
    borderRightStyle: "solid",
  },
  endTime: {
    color: theme.palette.grey[700],
  },
}));

export default SlotTime;
