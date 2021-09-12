import React, { useState } from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import EisbukAvatar from "@/components/users/EisbukAvatar";
import { Customer } from "eisbuk-shared";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { ETheme } from "@/themes";

import { useDispatch } from "react-redux";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import _ from "lodash";
import { SlotInterface, CustomerAttendance } from "@/types/temp";

interface Props {
  customer: Customer;
  attendance: CustomerAttendance;
  intervals: SlotInterface["intervals"];
  markAttendance: (payload: {
    customerId: Customer["id"];
    attendedInterval: string;
  }) => void;
  markAbsence: (payload: { customerId: Customer["id"] }) => void;
}

const UserAttendance: React.FC<Props> = ({
  customer,
  attendance,
  intervals,
  markAttendance,
  markAbsence,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { attended, booked } = attendance;
  const [localAttended, setLocalAttended] = useState(attended);
  const [selectedInterval, setSelectedInterval] = useState(booked);
  const listItemClass = attended ? "" : classes.absent;

  const handleClick = () => {
    const newAttended = attended && null;
    const customerId = customer.id;
    setLocalAttended(newAttended);
    dispatch(
      newAttended
        ? markAttendance({ attendedInterval: selectedInterval!, customerId })
        : markAbsence({ customerId })
    );
  };
  /** MUI Select in not a real select element so HTMLInputElement doesn't work as a type */
  const handleSelect = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedInterval(e.target.value as string);
  };

  const absenteeButtons = (
    <FormControl className={classes.formControl}>
      <InputLabel>Intervals</InputLabel>
      <select
        data-testid="select"
        value={booked!}
        onChange={handleSelect}
        disabled={!localAttended}
      >
        {_.keys(intervals).map((interval) => (
          <option
            key={`${customer.name}${customer.surname}${interval}`}
            value={interval}
          >
            {interval}
          </option>
        ))}
      </select>
      <Button
        data-testid="attendance-button"
        variant="contained"
        size="small"
        color={attended ? "primary" : "secondary"}
        onClick={handleClick}
        disabled={localAttended !== attended}
      >
        {localAttended ? "👎" : "👍"}
      </Button>
    </FormControl>
  );

  return (
    <ListItem className={listItemClass}>
      <ListItemAvatar>
        <EisbukAvatar {...customer} />
      </ListItemAvatar>
      <ListItemText primary={customer.name} />
      <ListItemSecondaryAction>{absenteeButtons}</ListItemSecondaryAction>
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
