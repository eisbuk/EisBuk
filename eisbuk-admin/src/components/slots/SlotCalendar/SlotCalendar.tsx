import React from "react";
import { makeStyles } from "@material-ui/styles";
import { DatePicker } from "@material-ui/pickers";
import { Box } from "@material-ui/core";
import { ParsableDate } from "@material-ui/pickers/constants/prop-types";

import { ETheme } from "@/themes";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {
    "& .MuiPickersStaticWrapper-staticWrapperRoot": {
      backgroundColor: "transparent",
    },
    "& .MuiPickersBasePicker-pickerView": {
      maxWidth: "100%",
      overflowX: "visible",
    },
    "& .MuiPickersCalendarHeader-transitionContainer p": {
      textTransform: "uppercase",
      opacity: 0.5,
      letterSpacing: theme.spacing(0.1),
    },
    "& .MuiPickersCalendarHeader-switchHeader": {
      marginBottom: theme.spacing(3),
      marginLeft: theme.spacing(3),
      marginRight: theme.spacing(3),
    },
    "& .MuiPickersDay-day, & .MuiPickersCalendarHeader-dayLabel": {
      width: 50,
      height: 50,
      fontSize: "1.2rem",
      color: theme.palette.common.white,
    },
    "& .MuiPickersCalendarHeader-dayLabel": {
      opacity: 0.5,
      fontWeight: 900,
    },
    "& .MuiPickersCalendar-transitionContainer": {
      minHeight: 320,
    },
    "& .MuiPickersDay-current": {
      border: "2px solid",
    },
    "& .MuiPickersDay-daySelected": {
      background: theme.palette.common.white,
      color: theme.palette.primary.main,
      "& .MuiIconButton-label p": {
        fontWeight: 900,
      },
    },
  },
}));

interface Props {
  date: ParsableDate;
  onChange: () => void;
}

const SlotCalendar: React.FC<Props> = ({ date, onChange }) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <DatePicker
        value={date}
        onChange={onChange}
        animateYearScrolling
        autoOk
        variant="static"
        views={["year", "month", "date"]}
        disableToolbar
      />
    </Box>
  );
};

export default SlotCalendar;
