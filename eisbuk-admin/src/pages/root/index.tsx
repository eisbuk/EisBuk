import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Container from "@material-ui/core/Container";
import List from "@material-ui/core/List";
import IconButton from "@material-ui/core/IconButton";
import PrintIcon from "@material-ui/icons/Print";
import makeStyles from "@material-ui/core/styles/makeStyles";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";
import AttendanceCard from "@/components/atoms/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getOrderedCustomers } from "@/store/selectors/customers";

const DashboardPage: React.FC = () => {
  const classes = useStyles();

  const attendanceCards = useSelector(getSlotsWithAttendance);
  const allCustomers = useSelector(getOrderedCustomers);

  const printButton = (
    <IconButton component={Link} to="/attendance_printable">
      <PrintIcon />
    </IconButton>
  );

  return (
    <>
      <AppbarAdmin />
      <DateNavigation extraButtons={printButton} jump="day">
        {() => (
          <Container maxWidth="md">
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
