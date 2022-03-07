import React from "react";
import { DateTime, DateTimeUnit } from "luxon";
import { useDispatch } from "react-redux";

import IconButton from "@mui/material/IconButton";

import { CalendarToday } from "@mui/icons-material";

import { CalendarPicker } from "@mui/lab";

import { changeCalendarDate } from "@/store/actions/appActions";
import Menu from "@mui/material/Menu";
import { __calendarPickerButtonId__ } from "@/__testData__/testIds";

interface Props {
  currentDate: DateTime;
  /**
   * Value for next/prev timeframe start time calculation
   */
  jump?: DateTimeUnit;
}

const DateSwitcher: React.FC<Props> = ({ currentDate, jump }) => {
  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const disableNonMondays = (day: DateTime) =>
    jump === "week" ? !day.startOf("week").equals(day) : false;

  return (
    <>
      <IconButton
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        data-testid={__calendarPickerButtonId__}
      >
        <CalendarToday />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <CalendarPicker
          shouldDisableDate={disableNonMondays}
          date={currentDate}
          onChange={(currentDate) => {
            dispatch(changeCalendarDate(currentDate!));
          }}
        />
      </Menu>
    </>
  );
};
export default DateSwitcher;
