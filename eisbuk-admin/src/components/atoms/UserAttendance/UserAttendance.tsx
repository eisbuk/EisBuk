import React, { useState } from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import EisbukAvatar from "@/components/users/EisbukAvatar";
import { Customer, BookingsMeta, Slot } from "eisbuk-shared";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { ETheme } from "@/themes";
import { markAttendance } from "@/store/actions/attendanceOperations";
import { useDispatch } from "react-redux";

type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props {
  attended: boolean;
  userBooking: UserBooking;
  slotId: Slot<"id">["id"];
}
const UserAttendance: React.FC<Props> = ({ attended, userBooking, slotId }) => {
  const [localAttended, setLocalAttended] = useState(attended);
  const classes = useStyles();
  const dispatch = useDispatch();
  const listItemClass = attended ? "" : classes.absent;

  const handleClick = (
    slotId: Slot<"id">["id"],
    userId: Customer["id"],
    attended: boolean
  ) => {
    const newAttended = !attended;
    setLocalAttended(newAttended);
    dispatch(markAttendance({ slotId, userId, attended: newAttended }));
  };

  const absenteeButtons = (
    <Button
      data-testid={`${userBooking.name}${userBooking.surname}`}
      variant="contained"
      size="small"
      color={attended ? "primary" : "secondary"}
      onClick={() => handleClick(slotId, userBooking.customer_id, attended)}
      // disabled={}
    >
      {attended ? "👎" : "👍"}
    </Button>
  );
  return (
    <ListItem className={listItemClass}>
      <ListItemAvatar>
        <EisbukAvatar {...userBooking} />
      </ListItemAvatar>
      <ListItemText primary={userBooking.name} />
      <ListItemSecondaryAction>{absenteeButtons}</ListItemSecondaryAction>
    </ListItem>
  );
};

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  absent: {
    backgroundColor: theme.palette.absent || theme.palette.grey[500],
  },
}));
// #endregion Styles
export default UserAttendance;
