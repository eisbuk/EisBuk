import React from "react";
import { Customer, BookingsMeta, Slot } from "eisbuk-shared";
import { fb2Luxon } from "@/utils/date";
import { markAttendance } from "@/store/actions/attendanceOperations";
import { useDispatch } from "react-redux";
// eslint-disable-next-line @typescript-eslint/no-empty-interface
type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props extends Slot<"id"> {
  userBookings: UserBooking[];
  absentees?: string[];
}

// mark attendees
const AttendanceCard: React.FC<Props> = ({
  date,
  durations,
  categories,
  userBookings,
  absentees,
}) => {
  const dispatch = useDispatch();

  // convert timestamp to luxon for easier processing
  const luxonStart = fb2Luxon(date);

  // convert durations to number values
  const durationNumbers = durations.map((duration) => Number(duration));
  const longestDuration = Math.max(...durationNumbers);

  // get end time of longest duration (we're still using durations here, so it's pretty straightforward)
  const luxonEnd = luxonStart.plus({ minutes: longestDuration });

  // get time for rendering
  const startTime = luxonStart.toISOTime().substring(0, 5);
  const endTime = luxonEnd.toISOTime().substring(0, 5);

  const timeString = `${startTime} - ${endTime}`;
  return (
    <div>
      <div data-testid="time-string">{timeString}</div>
      <div>{categories}</div>
      {userBookings.map((user) => {
        const isAbsent = absentees?.includes(user.customer_id) || false;
        return (
          <div key={user.customer_id}>
            <div>{user.name}</div>
            <div>{isAbsent ? "👎" : "👍"}</div>
            <button
              type="button"
              onClick={() =>
                dispatch(markAttendance(user.customer_id, isAbsent))
              }
            >
              {`Mark ${user.name} as ${!isAbsent ? "absent" : "present"}`}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceCard;
