import React from "react";
import { Customer } from "../../../../../eisbuk-shared/dist";
import { Category } from "../../../../../eisbuk-shared/dist/enums/firestore";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type UserBooking = Pick<Customer, "id"> &
  Pick<Customer, "name"> &
  Pick<Customer, "surname"> &
  Pick<Customer, "certificateExpiration">;

interface Props {
  time: string;
  category: Category;
  userBookings: UserBooking[];
}

// mark attendees
const AttendanceCard: React.FC<Props> = (props) => {
  return (
    <div>
      <div>{props.time}</div>
      <div>{props.category}</div>
      {props.userBookings.map((user) => {
        return (
          <div key={user.id}>
            <div>{user.name}</div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceCard;
