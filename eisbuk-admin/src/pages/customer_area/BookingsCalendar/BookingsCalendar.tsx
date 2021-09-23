import DateNavigation from "@/components/atoms/DateNavigation";
import React from "react";

import Grid from "@material-ui/core/Grid";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotsById } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import BookingCard from "@/components/atoms/BookingCard";
import { BookingCardVariant } from "@/enums/components";

interface Props {
  /**
   * List of slots for given month.
   * We're filtering those based on bookings
   */
  slots: SlotsById;
  /**
   * Booked slots we're using as a filter mask to render only the booked slots with proper booked intervals
   */
  bookedSlots: LocalStore["firestore"]["data"]["bookedSlots"];
}

/**
 * A component used by `customers` page to render the booked slots as `BookingCard`s.
 */
const BookingsCalendar: React.FC<Props> = ({ slots, bookedSlots }) => {
  const classes = useStyles();

  const bookedSlotIds = Object.keys(bookedSlots || {});

  return (
    <DateNavigation jump="week">
      {() => (
        <>
          <Grid className={classes.bookingsListContainer} container spacing={3}>
            {bookedSlotIds.map((slotId) => {
              const { intervals, ...slotData } = slots[slotId];
              const bookedIntervalString = bookedSlots
                ? bookedSlots[slotId].interval
                : "";
              const interval = intervals[bookedIntervalString];

              return (
                <Grid key={slotId} item xs={12} sm={6} md={4} lg={3}>
                  <BookingCard
                    {...{ ...slotData, interval }}
                    variant={BookingCardVariant.Calendar}
                  />
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </DateNavigation>
  );
};

const useStyles = makeStyles((theme) => ({
  bookingsListContainer: {
    marginTop: theme.spacing(0.5),
    justifyContent: "center",
  },
}));

export default BookingsCalendar;
