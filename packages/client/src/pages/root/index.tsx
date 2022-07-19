import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { CalendarNav, Layout } from "@eisbuk/ui";
import { Printer } from "@eisbuk/svg";

import Container from "@mui/material/Container";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import makeStyles from "@mui/styles/makeStyles";

import { OrgSubCollection } from "@eisbuk/shared";

import AttendanceCard from "@/components/atoms/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCustomersList } from "@/store/selectors/customers";
import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { changeCalendarDate } from "@/store/actions/appActions";
import { getCalendarDay } from "@/store/selectors/app";

import { adminLinks } from "@/data/navigation";

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const classes = useStyles();

  useFirestoreSubscribe([
    OrgSubCollection.Attendance,
    OrgSubCollection.Customers,
    OrgSubCollection.SlotsByDay,
  ]);

  const currentDate = useSelector(getCalendarDay);

  const attendanceCards = useSelector(getSlotsWithAttendance());
  const allCustomers = useSelector(getCustomersList(true));

  const printButton = (
    <IconButton
      className="h-8 p-1"
      component={Link}
      to="/attendance_printable"
      size="large"
    >
      <Printer />
    </IconButton>
  );

  return (
    <Layout isAdmin adminLinks={adminLinks}>
      <CalendarNav
        date={currentDate}
        onChange={(date) => dispatch(changeCalendarDate(date))}
        jump="day"
        additionalContent={printButton}
      />
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
    </Layout>
  );
};

const useStyles = makeStyles(() => ({
  root: {
    padding: "0.25rem",
  },
}));

export default DashboardPage;
