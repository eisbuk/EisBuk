import DateNavigation from "@/components/atoms/DateNavigation";
import React from "react";

import Grid from "@material-ui/core/Grid";

import makeStyles from "@material-ui/core/styles/makeStyles";

import BookingCard from "@/components/atoms/BookingCard";

interface Props {
  /**
   * Array of bookings to display -> booked slot data + duration
   */
  // bookings?: Array<BookingCardProps & { id: string }>;
  bookings?: Array<any & { id: string }>;
}

/**
 * A component used by `customers` page to render the booked slots as `BookingCard`s.
 */
const BookingsCalendar: React.FC<Props> = ({ bookings }) => {
  const classes = useStyles();

  return (
    <DateNavigation jump="week">
      {() => (
        <>
          <Grid className={classes.bookingsListContainer} container spacing={3}>
            {bookings?.map((booking) => (
              <Grid key={booking.id} item xs={12} sm={6} md={4} lg={3}>
                <BookingCard {...booking} />
              </Grid>
            ))}
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
