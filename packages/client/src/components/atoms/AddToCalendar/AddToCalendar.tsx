import React from "react";
import { useTranslation, ActionButton } from "@eisbuk/translations";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import { ICalendar } from "datebook";

import makeStyles from "@mui/styles/makeStyles";

import Button from "@mui/material/Button";

import { LocalStore } from "@/types/store";
import { __addToCalendarButtonId__ } from "@/__testData__/testIds";
import { getAboutOrganization } from "@/store/selectors/app";

interface Props {
  /**
   * Record of subscribed slots with subscribed slotIds as keys and subscribed duration as value.
   * Doesn't need to be organized as we're checking for each value by key (no need for ordering and grouping).
   */
  bookedSlots?: LocalStore["firestore"]["data"]["bookedSlots"];
}
const AddToCalendar: React.FC<Props> = ({ bookedSlots = {} }) => {
  const classes = useStyles();

  const { displayName = "", location = "" } =
    useSelector(getAboutOrganization) || {};
  const { t } = useTranslation();

  const handleClick = () => {
    let icalendar = {} as ICalendar;

    Object.values(bookedSlots).forEach((bookedSlot, i) => {
      const startDate = getStartDate(bookedSlot.date, bookedSlot.interval);
      const endDate = getEndDate(bookedSlot.date, bookedSlot.interval);

      const bookedSlotEvent = {
        title: `Booked Slot at ${displayName}`,
        location: location,
        start: startDate,
        end: endDate,
      };

      // ICalendar needs to be instantiated with an event
      // which can't be an empty object so on the first iteration
      // it's instantiated with the first bookedSlotEvent

      if (i === 0) {
        icalendar = new ICalendar(bookedSlotEvent).addProperty(
          "UID",
          `${bookedSlot.date}${bookedSlot.interval}`
        );
      } else {
        // To add another event to the calendar it must be of type ICalendar

        icalendar
          .addEvent(new ICalendar(bookedSlotEvent))
          .addProperty("UID", `${bookedSlot.date}${bookedSlot.interval}`);
      }
    });
    icalendar.download("Booked_Slots.ics");
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
