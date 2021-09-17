import React from "react";

import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterval } from "@/types/temp";
import Button from "@material-ui/core/Button";

interface SlotTimeProps {
  interval: SlotInterval;
  disabled: boolean;
}

/**
 * Presentational component used to move slot time dispay out of main component (for readability).
 * Gets passed start time and subscribed duration (if any).
 */
const SlotTime: React.FC<SlotTimeProps> = ({ interval, disabled }) => {
  const classes = useStyles();

  return (
    /** @TODO use interval key*/
    /** @TODO color based on if its booked or not*/
    <Box p={1} flexShrink={0} className={classes.slotTime}>
      <Button
        key={interval.startTime}
        color="primary"
        variant="text"
        className={classes.duration}
        disabled={disabled}
      >
        <Typography
          key="start"
          display="inline"
          variant="h5"
          component="h2"
          color="primary"
        >
          <strong>{interval.startTime}</strong>
        </Typography>{" "}
        - {interval.endTime}
        <Typography
          key="end"
          display="inline"
          variant="h6"
          component="h3"
          className={classes.endTime}
        ></Typography>
      </Button>
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
  duration: {},
}));

export default SlotTime;
