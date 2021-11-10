import React from "react";
import { useSelector } from "react-redux";

import Container from "@material-ui/core/Container";
import List from "@material-ui/core/List";

import makeStyles from "@material-ui/core/styles/makeStyles";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";
import AttendanceCard from "@/components/atoms/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCustomersList } from "@/store/selectors/customers";

const DashboardPage: React.FC = () => {
  const classes = useStyles();

  const attendanceCards = useSelector(getSlotsWithAttendance);
  const allCustomers = useSelector(getCustomersList);

  return (
    <>
      <AppbarAdmin />
      <DateNavigation jump="day">
        {() => (
          <Container maxWidth="sm">
            <List className={classes.root}>
              {attendanceCards.map((attendanceCard) => (
                <AttendanceCard
                  key={attendanceCard.id}
                  {...{ ...attendanceCard, allCustomers }}
                />
              ))}
            </List>
          </Container>
        )}
      </DateNavigation>
    </>
  );
};

const useStyles = makeStyles(() => ({
  root: {},
}));

export default DashboardPage;
