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
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";

type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props {
  attended: boolean;
  userBooking: UserBooking;
  slotId: Slot<"id">["id"];
  intervals: string[];
}

const UserAttendance: React.FC<Props> = ({
  attended,
  userBooking,
  slotId,
  intervals,
}) => {
  const [localAttended, setLocalAttended] = useState(attended);
  const classes = useStyles();
  const dispatch = useDispatch();
  const listItemClass = attended ? "" : classes.absent;

  const handleClick = () => {
    const newAttended = !attended;
    setLocalAttended(newAttended);
    dispatch(
      markAttendance({
        slotId,
        userId: userBooking.customer_id,
        attended: newAttended,
      })
    );
  };

  const absenteeButtons = (
    <Button
      data-testid={`${userBooking.name}${userBooking.surname}`}
      variant="contained"
      size="small"
      color={attended ? "primary" : "secondary"}
      onClick={handleClick}
      disabled={localAttended !== attended}
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
      <FormControl className={classes.formControl}>
        <InputLabel>Intervals</InputLabel>
        <Select
          data-testid={`${userBooking.name}${userBooking.surname}Dropdown`}
          native
          value={intervals[0]}
          // onChange={handleChange}
          // inputProps={{
          //   name: "",
          //   id: "",
          // }}
        >
          {/**  @TODO booked value as init value */}
          <option aria-label="None" value="" />
          {intervals.map((interval) => (
            <option value={interval}>{interval}</option>
          ))}
        </Select>
      </FormControl>
      ;
    </ListItem>
  );
};

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  absent: {
    backgroundColor: theme.palette.absent || theme.palette.grey[500],
  },
  button: {
    display: "block",
    marginTop: theme.spacing(2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));
// #endregion Styles
export default UserAttendance;
