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
import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";
import { useDispatch } from "react-redux";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import _ from "lodash";
import { SlotInterface } from "@/types/temp";

type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props {
  attended: boolean;
  userBooking: UserBooking;
  slotId: Slot<"id">["id"];
  intervals: SlotInterface["intervals"];
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
      newAttended
        ? markAttendance({
            slotId,
            customerId: userBooking.customer_id,
            attendedInterval: "",
          })
        : markAbsence({ slotId, customerId: userBooking.customer_id })
    );
  };
  const handleSelect = (interval: string) => {
    dispatch(
      selectInterval({
        slotId,
        userId: userBooking.customer_id,
        interval,
      })
    );
  };

  const absenteeButtons = (
    <FormControl className={classes.formControl}>
      <InputLabel>Intervals</InputLabel>
      <Select
        data-testid={`${userBooking.name}-${userBooking.surname}-select`}
        value="13:00 - 14:00"
        onChange={() => handleSelect("13:15 - 14:15")}
        // materialUI <select> element is an abstraction for a bunch of other elements
        // inputProps sets the testid of <input> element inside the <select>
        // so that rtl can fireEvents on it
        inputProps={{
          "data-testid": `${userBooking.name}-${userBooking.surname}-input`,
          disabled: !localAttended,
        }}
      >
        {_.entries(intervals).map((interval) => (
          <option
            key={`${userBooking.name}${userBooking.surname}${interval}`}
            value={interval[0]}
          >
            {interval}
          </option>
        ))}
      </Select>
      <Button
        data-testid={`${userBooking.name}-${userBooking.surname}`}
        variant="contained"
        size="small"
        color={attended ? "primary" : "secondary"}
        onClick={handleClick}
        disabled={localAttended !== attended}
      >
        {attended ? "👎" : "👍"}
      </Button>
    </FormControl>
  );

  return (
    <ListItem className={listItemClass}>
      <ListItemAvatar>
        <EisbukAvatar {...userBooking} />
      </ListItemAvatar>
      <ListItemText primary={userBooking.name} />
      <ListItemSecondaryAction>{absenteeButtons}</ListItemSecondaryAction>;
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
    display: "flex",
    flexDirection: "row",
  },
}));
// #endregion Styles
export default UserAttendance;
