import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Box, Typography } from "@material-ui/core";
import { DateTime } from "luxon";

const useStyles = makeStyles(() => ({
  weekDay: {
    textTransform: "capitalize",
    fontWeight: 300,
  },
  day: {
    fontWeight: 900,
  },
  month: {
    textTransform: "uppercase",
    fontWeight: 900,
  },
}));

interface Props {
  date: DateTime;
}

const SlotCalendarDate: React.FC<Props> = ({ date }) => {
  const classes = useStyles();
  return (
    <>
      <Box display="flex">
        <Box>
          <Typography variant="h5" className={classes.weekDay}>
            {date.setLocale("it").toFormat("EEEE")}
          </Typography>
        </Box>
        <Box p={3}>
          <Typography variant="h4" className={classes.day}>
            {date.setLocale("it").toFormat("dd")}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" className={classes.month}>
            {date.setLocale("it").toFormat("MMMM")}
          </Typography>
          <Typography className={(classes as any).year}>
            {date.setLocale("it").toFormat("yyyy")}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default SlotCalendarDate;
