import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { SlotInterval } from "eisbuk-shared";

/**
 * Presentational component used to move slot time dispay out of main component (for readability).
 * Gets passed start time and subscribed duration (if any).
 */
const SlotTime: React.FC<SlotInterval & { backgroundColor?: string }> = ({
  startTime,
  endTime,
  backgroundColor = "none",
}) => {
  const classes = useStyles();

  return (
    <Box
      style={{ backgroundColor }}
      p={1}
      flexShrink={0}
      className={classes.slotTime}
    >
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
}));

export default SlotTime;
