import React from "react";
import { useSelector } from "react-redux";

import Container from "@mui/material/Container";
import List from "@mui/material/List";
import makeStyles from "@mui/styles/makeStyles";

import AttendanceCard from "@/components/atoms/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCustomersList } from "@/store/selectors/customers";

const AttendanceByDayView: React.FC = () => {
  const classes = useStyles();

  const attendanceCards = useSelector(getSlotsWithAttendance);
  const allCustomers = useSelector(getCustomersList(true));

  return (
    <Container className={classes.root} maxWidth="md">
      <List>
        {attendanceCards.map((attendanceCard) => (
          <AttendanceCard
            key={attendanceCard.id}
            {...{ ...attendanceCard, allCustomers }}
          />
        ))}
      </List>
    </Container>
  );
};

const useStyles = makeStyles(() => ({
  root: {
    padding: "0.25rem",
  },
}));

export default AttendanceByDayView;
