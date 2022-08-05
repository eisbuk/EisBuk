import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";

import { Button, CalendarNav, Layout } from "@eisbuk/ui";
import { Printer } from "@eisbuk/svg";

import Container from "@mui/material/Container";
import List from "@mui/material/List";
import makeStyles from "@mui/styles/makeStyles";

import { OrgSubCollection } from "@eisbuk/shared";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import AttendanceCard from "@/components/atoms/AttendanceCard";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCalendarDay } from "@/store/selectors/app";
import {
  getCustomersByBirthday,
  getCustomersList,
} from "@/store/selectors/customers";

import { changeCalendarDate } from "@/store/actions/appActions";

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
  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );

  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );
  const printButton = (
    <Link to="/attendance_printable">
      <Button className="h-8 w-8 !p-[2px] rounded-full text-gray-700 hover:bg-black/10">
        <Printer />
      </Button>
    </Link>
  );

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
      calendarNav={
        <CalendarNav
          date={currentDate}
          onChange={(date) => dispatch(changeCalendarDate(date))}
          jump="day"
          additionalContent={printButton}
        />
      }
    >
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
