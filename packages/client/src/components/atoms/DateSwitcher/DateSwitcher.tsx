import React from "react";
import { DateTime, DateTimeUnit } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import { DateHasBookingsMap } from "@eisbuk/shared";

import Menu, { MenuProps } from "@mui/material/Menu";
import { CalendarPicker } from "@mui/lab";
import Badge from "@mui/material/Badge";
import PickersDay, { PickersDayProps } from "@mui/lab/PickersDay";

import { styled } from "@mui/material/styles";

import { changeCalendarDate } from "@/store/actions/appActions";
import { getCalendarData } from "@/store/selectors/calendar";

import {
  __calendarMenuId__,
  __dayWithBookedSlots__,
  __dayWithSlots__,
  __pickedDay__,
} from "@/__testData__/testIds";

interface Props extends MenuProps {
  currentDate: DateTime;
  jump: DateTimeUnit;
}

const DateSwitcher: React.FC<Props> = ({ currentDate, jump, ...MenuProps }) => {
  const dispatch = useDispatch();
  const start = currentDate.startOf("week");
  const end = currentDate.endOf("week");
  const calendarData = useSelector(getCalendarData(currentDate.toISO()));

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
    calendarData: DateHasBookingsMap,
    jump: DateTimeUnit
  ) =>
  (
    date: DateTime,
    selectedDates: (DateTime | null)[],
    pickersDayProps: PickersDayProps<DateTime>
  ): JSX.Element => {
    const dayIsBetween = date > start.endOf("day") && date < end.startOf("day");
    const isFirstDay = date.equals(start);
    const isLastDay = date.endOf("day").equals(end);
    const hasSlots = calendarData[date.toISO().substring(0, 10)];

    return (
      <Badge
        key={date.toString()}
        overlap="circular"
        variant="dot"
        color={hasSlots === "hasSlots" ? "secondary" : "success"}
        invisible={!hasSlots}
        data-testid={
          hasSlots &&
          (hasSlots === "hasSlots" ? __dayWithSlots__ : __dayWithBookedSlots__)
        }
      >
        {jump === "day" ? (
          <PickersDay {...pickersDayProps} />
        ) : (
          <CustomPickersDay
            {...pickersDayProps}
            disableMargin
            dayIsBetween={dayIsBetween}
            isFirstDay={isFirstDay}
            isLastDay={isLastDay}
            data-testid={
              dayIsBetween || isFirstDay || isLastDay ? __pickedDay__ : ""
            }
          />
        )}
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
  // if any of the three apply color and hover and borderradius
  ...((dayIsBetween || isFirstDay || isLastDay) && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isLastDay && {
    borderTopRightRadius: "50%",
    borderBottomRightRadius: "50%",
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: "50%",
    borderBottomLeftRadius: "50%",
  }),
})) as React.ComponentType<CustomPickerDayProps>;
export default DateSwitcher;
