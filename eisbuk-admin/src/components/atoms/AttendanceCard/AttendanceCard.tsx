import React from "react";
import { useDispatch } from "react-redux";
import i18n from "i18next";

import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import makeStyles from "@material-ui/core/styles/makeStyles";

import { Category, SlotType } from "eisbuk-shared";

import {
  CustomerWithAttendance,
  SlotInterface,
  SlotInterval,
} from "@/types/temp";

import UserAttendance from "@/components/atoms/AttendanceCard/UserAttendance";

import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";

import { ETheme } from "@/themes";
import { categoryLabel, slotTypeLabel } from "@/lib/labels";

export interface Props extends SlotInterface {
  customers: CustomerWithAttendance[];
}

// mark attendees
const AttendanceCard: React.FC<Props> = ({
  categories,
  customers,
  intervals,
  type,
  id,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const timeString = getTimeString(intervals);

  return (
    <div className={classes.wrapper}>
      <ListItem className={classes.listHeader}>
        <ListItemText
          primary={
            <span>
              {timeString} <b>({customers.length})</b>
            </span>
          }
          secondary={translateAndJoinTags(categories, type)}
        />
      </ListItem>
      {customers.map((customer) => (
        <UserAttendance
          {...{ ...customer, intervals }}
          key={customer.id}
          markAttendance={({ attendedInterval }) =>
            dispatch(
              markAttendance({
                attendedInterval,
                slotId: id,
                customerId: customer.id,
              })
            )
          }
          markAbsence={() =>
            dispatch(
              markAbsence({
                slotId: id,
                customerId: customer.id,
              })
            )
          }
        />
      ))}
    </div>
  );
};

// #region localUtils
/**
 * Calculates earliest startTime and latest endTime out of intervals. And returns `"${startTime} - ${endTime}""` string
 * @param intervals all intervals for the slot
 * @returns time string
 */
const getTimeString = (intervals: Props["intervals"]): string => {
  // calculate single { startTime, endTime } object
  const { startTime, endTime } = Object.values(intervals).reduce(
    (acc, interval) => {
      const startTime =
        !acc.startTime || acc.startTime > interval.startTime
          ? interval.startTime
          : acc.startTime;
      const endTime =
        !acc.endTime || acc.endTime < interval.endTime
          ? interval.endTime
          : acc.endTime;

      return { startTime, endTime };
    },
    {} as SlotInterval
  );
  // return time string
  return `${startTime} - ${endTime}`;
};

const translateAndJoinTags = (categories: Category[], type: SlotType) => {
  const translatedCategories = categories.map((category) =>
    i18n.t(categoryLabel[category])
  );
  const translatedType = i18n.t(slotTypeLabel[type]);

  return `${[...translatedCategories, translatedType].join(" ")}`;
};
// #endregion localUtils

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  listHeader: {
    backgroundColor: theme.palette.primary.light,
  },
  wrapper: {
    marginBottom: theme.spacing(1.5),
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.primary.main,
  },
}));
// #endregion Styles
export default AttendanceCard;
