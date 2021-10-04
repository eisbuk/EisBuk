import React from "react";

import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterval } from "eisbuk-shared";

/**
 * Presentational component used to move slot time dispay out of main component (for readability).
 * Gets passed start time and subscribed duration (if any).
 */
const SlotTime: React.FC<SlotInterval> = ({ startTime, endTime }) => {
  const classes = useStyles();

  return (
    <Box p={1} flexShrink={0} className={classes.slotTime}>
      <Typography key="start" display="inline" variant="h5" component="h2">
        <strong>{`${startTime} - ${endTime}`}</strong>
      </Typography>
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
