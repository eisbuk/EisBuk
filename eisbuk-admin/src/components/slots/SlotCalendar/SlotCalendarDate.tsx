import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Box, Typography } from "@material-ui/core";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <>
      <Box display="flex">
        <Box>
          <Typography variant="h5" className={classes.weekDay}>
            {t("SlotCalendarDate.Weekday", { date })}
          </Typography>
        </Box>
        <Box p={3}>
          <Typography variant="h4" className={classes.day}>
            {t("SlotCalendarDate.Day", { date })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" className={classes.month}>
            {t("SlotCalendarDate.Month", { date })}
          </Typography>
          <Typography className={(classes as any).year}>
            {t("SlotCalendarDate.Year", { date })}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default SlotCalendarDate;
