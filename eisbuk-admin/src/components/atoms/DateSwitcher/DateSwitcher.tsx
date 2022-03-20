import React from "react";
import { DateTime, DateTimeUnit } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import Menu, { MenuProps } from "@mui/material/Menu";
import { CalendarPicker } from "@mui/lab";
import Badge from "@mui/material/Badge";
import PickersDay, { PickersDayProps } from "@mui/lab/PickersDay";

import { styled } from "@mui/material/styles";

import { changeCalendarDate } from "@/store/actions/appActions";
import { getCalendarData } from "@/store/selectors/calendar";

import { __calendarMenuId__ } from "@/__testData__/testIds";

interface Props extends MenuProps {
  currentDate: DateTime;
  jump: DateTimeUnit;
}

const DateSwitcher: React.FC<Props> = ({ currentDate, jump, ...MenuProps }) => {
  const dispatch = useDispatch();
  const start = currentDate.startOf("week");
  const end = currentDate.endOf("week");
  const calendarData = useSelector(getCalendarData);

  return (
    <>
      <Menu data-testid={__calendarMenuId__} {...MenuProps}>
        <CalendarPicker
          date={currentDate}
          onChange={(currentDate) => {
            dispatch(changeCalendarDate(currentDate!));
          }}
          renderDay={renderWeekPickerDay(
            currentDate,
            start,
            end,
            calendarData,
            jump
          )}
        />
      </Menu>
    </>
  );
};

const renderWeekPickerDay =
  (
    currentDate: DateTime,
    start: DateTime,
    end: DateTime,
    calendarData: { [dayInISO: string]: string },
    jump: DateTimeUnit
  ) =>
  (
    date: DateTime,
    selectedDates: (DateTime | null)[],
    pickersDayProps: PickersDayProps<DateTime>
  ): JSX.Element => {
    if (jump === "day") {
      return <PickersDay {...pickersDayProps} />;
    }

    const dayIsBetween = date > start && date < end;
    const isFirstDay = date.equals(start);
    const isLastDay = date.endOf("day").equals(end);
    const hasSlots = calendarData[date.toISO().substring(0, 10)];

    return (
      <Badge
        key={date.toString()}
        overlap="circular"
        variant="dot"
        color={hasSlots === "slots" ? "secondary" : "success"}
        invisible={!hasSlots}
      >
        <CustomPickersDay
          {...pickersDayProps}
          disableMargin
          dayIsBetween={dayIsBetween}
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
          showDaysOutsideCurrentMonth
        />
      </Badge>
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
