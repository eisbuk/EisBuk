import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import EisbukAvatar from "@/components/users/EisbukAvatar";
import { Customer, BookingsMeta } from "eisbuk-shared";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { ETheme } from "@/themes";
import { markAttendance } from "@/store/actions/attendanceOperations";
import { useDispatch } from "react-redux";

type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props {
  isAbsent?: boolean;
  userBooking: UserBooking;
}
const UserAttendance: React.FC<Props> = ({ isAbsent, userBooking }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const listItemClass = isAbsent ? classes.absent : "";

  const absenteeButtons = (
    <Button
      variant="contained"
      size="small"
      color={isAbsent ? "primary" : "secondary"}
      onClick={() =>
        dispatch(markAttendance(userBooking.customer_id, isAbsent))
      }
      // disabled={hasLocalChange}
    >
      {isAbsent ? "👎" : "👍"}
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
