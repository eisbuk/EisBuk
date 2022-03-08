import React from "react";
import { DateTime, DateTimeUnit } from "luxon";
import { useDispatch } from "react-redux";

import { CalendarPicker } from "@mui/lab";

import { changeCalendarDate } from "@/store/actions/appActions";
import Menu from "@mui/material/Menu";

interface Props {
  currentDate: DateTime;
  /**
   * Value for next/prev timeframe start time calculation
   */
  jump?: DateTimeUnit;
  anchorEl: null | HTMLElement;
  open: boolean;
  handleClose: () => void;
}

const DateSwitcher: React.FC<Props> = ({
  currentDate,
  jump,
  anchorEl,
  open,
  handleClose,
}) => {
  const dispatch = useDispatch();

  const disableNonMondays = (day: DateTime) =>
    jump === "week" ? !day.startOf("week").equals(day) : false;

  return (
    <>
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
