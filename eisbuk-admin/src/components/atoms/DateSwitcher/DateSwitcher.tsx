import React from "react";
import { DateTime } from "luxon";
import { useDispatch } from "react-redux";

import { CalendarPicker } from "@mui/lab";

import { changeCalendarDate } from "@/store/actions/appActions";
import Menu from "@mui/material/Menu";
import PickersDay, { PickersDayProps } from "@mui/lab/PickersDay/PickersDay";
import { styled } from "@mui/material/styles";

interface Props {
  currentDate: DateTime;
  anchorEl: null | HTMLElement;
  open: boolean;
  handleClose: () => void;
}

const DateSwitcher: React.FC<Props> = ({
  currentDate,
  anchorEl,
  open,
  handleClose,
}) => {
  const dispatch = useDispatch();

  return (
    <>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <CalendarPicker
          // shouldDisableDate={disableNonMondays}
          date={currentDate}
          onChange={(currentDate) => {
            dispatch(changeCalendarDate(currentDate!));
          }}
          renderDay={renderWeekPickerDay(currentDate)}
        />
      </Menu>
    </>
  );
};

const renderWeekPickerDay =
  (currentDate: DateTime) =>
  (
    date: DateTime,
    selectedDates: (DateTime | null)[],
    pickersDayProps: PickersDayProps<DateTime>
  ): JSX.Element => {
    if (!currentDate) {
      return <PickersDay {...pickersDayProps} />;
    }

    const start = currentDate.startOf("week");
    const end = currentDate.endOf("week");

    const dayIsBetween = date > start && date < end;
    const isFirstDay = date.equals(start);
    const isLastDay = date.endOf("day").equals(end);

    return (
      <CustomPickersDay
        {...pickersDayProps}
        disableMargin
        dayIsBetween={dayIsBetween}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
      />
    );
  };

type CustomPickerDayProps = PickersDayProps<DateTime> & {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
};

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== "dayIsBetween" && prop !== "isFirstDay" && prop !== "isLastDay",
})<CustomPickerDayProps>(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isFirstDay && {
    borderRadius: "0",
    borderTopLeftRadius: "50%",
    borderBottomLeftRadius: "50%",
  }),
  ...(isLastDay && {
    borderTopRightRadius: "50%",
    borderBottomRightRadius: "50%",
  }),
})) as React.ComponentType<CustomPickerDayProps>;
export default DateSwitcher;
