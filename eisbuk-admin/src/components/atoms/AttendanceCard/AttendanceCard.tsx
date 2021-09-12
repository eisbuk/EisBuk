import React from "react";
import i18n from "i18next";

// import { useTranslation } from "react-i18next";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import makeStyles from "@material-ui/core/styles/makeStyles";
import UserAttendance from "@/components/atoms/AttendanceCard/UserAttendance";
import { CustomerAttendance, SlotInterface } from "@/types/temp";
import { Customer, Category, SlotType } from "eisbuk-shared";
import { useDispatch } from "react-redux";

import { ETheme } from "@/themes";
import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";
import _ from "lodash";
import { DateTime } from "luxon";

interface Props extends SlotInterface {
  customers: Customer[];
  attendance: {
    [key: string]: CustomerAttendance;
  };
}

// mark attendees
const AttendanceCard: React.FC<Props> = ({
  date,
  categories,
  customers,
  attendance,
  intervals,
  type,
  id,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  // const { t } = useTranslation();

  // get earliest startTme and latest endTme from intervals
  const startTimes = _.entries(intervals).map((interval) =>
    DateTime.fromFormat(interval[1].startTime, "HH:mm")
  );
  const startTime = DateTime.min(...startTimes).toFormat("HH:mm");
  const endTimes = _.entries(intervals).map((interval) =>
    DateTime.fromFormat(interval[1].endTime, "HH:mm")
  );
  const endTime = DateTime.max(...endTimes).toFormat("HH:mm");

  // get time for rendering
  // const startTime = luxonStart.toISOTime().substring(0, 5);
  // const endTime = luxonEnd.toISOTime().substring(0, 5);

  const timeString = `${startTime} - ${endTime}`;

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
      {customers.map((user) => (
        <UserAttendance
          key={user.id}
          customer={user}
          intervals={intervals}
          attendance={attendance[user.id]}
          markAttendance={() =>
            dispatch(
              markAttendance({
                attendedInterval: attendance[user.id].attended!,
                slotId: id,
                customerId: user.id,
              })
            )
          }
          markAbsence={() =>
            dispatch(
              markAbsence({
                slotId: id,
                customerId: user.id,
              })
            )
          }
        />
      ))}
    </div>
  );
};

// #region Start Region Local Utils

const translateAndJoinTags = (categories: Category[], type: SlotType) => {
  const translatedCategories = categories.map((category) =>
    i18n.t(`Categories.${category}`)
  );
  const translatedType = i18n.t(`SlotTypes.${type}`);

  return `${[...translatedCategories, translatedType].join(" ")}`;
};
// #endregion Local Utils

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
