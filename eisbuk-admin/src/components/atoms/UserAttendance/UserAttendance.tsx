import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import EisbukAvatar from "@/components/users/EisbukAvatar";
import { Customer, BookingsMeta } from "eisbuk-shared";
type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props {
  key: string;
  name: string;
  userBooking: UserBooking;
}
const UserAttendance: React.FC<Props> = ({ key, name, userBooking }) => {
  return (
    <ListItem key={key}>
      <ListItemAvatar>
        <EisbukAvatar {...userBooking} />
      </ListItemAvatar>
      <ListItemText primary={name} />
      {/* <ListItemSecondaryAction>{absenteeButtons}</ListItemSecondaryAction> */}
    </ListItem>
  );
};
export default UserAttendance;
