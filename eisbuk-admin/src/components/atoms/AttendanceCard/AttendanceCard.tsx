import React from "react";
import { Customer } from "../../../../../eisbuk-shared/dist";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type UserBooking = Pick<Customer, "id"> &
  Pick<Customer, "name"> &
  Pick<Customer, "surname"> &
  Pick<Customer, "certificateExpiration">;

interface Props {
  time: string;
  userBookings: UserBooking[];
}

// mark attendees
const AttendanceCard: React.FC<Props> = (props) => {
  return (
    <div>
      <div>{props.time}</div>
      {props.userBookings.map((user) => {
        return <div key={user.id}>{user.name}</div>;
      })}
    </div>
  );
};

export default AttendanceCard;
