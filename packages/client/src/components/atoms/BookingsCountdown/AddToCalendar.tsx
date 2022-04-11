import React from "react";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import { ICalendar } from "datebook";

import makeStyles from "@mui/styles/makeStyles";

import Button from "@mui/material/Button";

import { ActionButton } from "@eisbuk/translations";
import { LocalStore } from "@/types/store";
import { __addToCalendarButtonId__ } from "@/__testData__/testIds";

interface Props {
  /**
   * Record of subscribed slots with subscribed slotIds as keys and subscribed duration as value.
   * Doesn't need to be organized as we're checking for each value by key (no need for ordering and grouping).
   */
  bookedSlots?: LocalStore["firestore"]["data"]["bookedSlots"];
}
const AddToCalendar: React.FC<Props> = ({ bookedSlots = {} }) => {
  const classes = useStyles();

  const { t } = useTranslation();

  // is displayed when bookings are finalized aka deadline is null
  const handleClick = () => {
    let icalendar: ICalendar;

    Object.values(bookedSlots).forEach((bookedSlot, i) => {
      const startDate = getStartDate(bookedSlot.date, bookedSlot.interval);
      const endDate = getEndDate(bookedSlot.date, bookedSlot.interval);

      const bookedSlotEvent = {
        title: "Booked_Slots",
        start: startDate,
        end: endDate,
      };

      /**
       * ICalendar needs to be instantiated with an event
       * which can't be an empty object so on the first iteration
       * it's instantiated with the first bookedSlotEvent
       */
      if (i === 0) {
        icalendar = new ICalendar(bookedSlotEvent);
      } else {
        /**
         * To add another event to the calendar it must be of type ICalendar
         */
        icalendar.addEvent(new ICalendar(bookedSlotEvent));
      }
      /**
       * Download calendar on last iteration
       */
      if (i === Object.keys(bookedSlots).length - 1) {
        icalendar.download();
      }
    });
  };
  return (
    <div className={classes.container}>
      <Button
        data-testid={__addToCalendarButtonId__}
        onClick={handleClick}
        variant="contained"
      >
        {t(ActionButton.AddToCalendar)}
      </Button>
    </div>
  );
};

// #region helpers

const getStartDate = (date: string, interval: string) =>
  DateTime.fromISO(date)
    .set({
      hour: Number(interval.substring(0, 2)),
      minute: Number(interval.substring(3, 5)),
    })
    .toJSDate();
const getEndDate = (date: string, interval: string) =>
  DateTime.fromISO(date)
    .set({
      hour: Number(interval.substring(6, 8)),
      minute: Number(interval.substring(9, 11)),
    })
    .toJSDate();
// #endregion helpers

// #region styles
const useStyles = makeStyles(() => ({
  container: {
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
}));
// #endregion styles

export default AddToCalendar;
