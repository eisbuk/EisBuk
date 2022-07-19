import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { Layout } from "@eisbuk/ui";

import Container from "@mui/material/Container";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import PrintIcon from "@mui/icons-material/Print";
import makeStyles from "@mui/styles/makeStyles";

import { OrgSubCollection } from "@eisbuk/shared";

import DateNavigation from "@/components/atoms/DateNavigation";
import AttendanceCard from "@/components/atoms/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCustomersList } from "@/store/selectors/customers";
import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { adminLinks } from "@/data/navigation";

const DashboardPage: React.FC = () => {
  const classes = useStyles();

  useFirestoreSubscribe([
    OrgSubCollection.Attendance,
    OrgSubCollection.Customers,
    OrgSubCollection.SlotsByDay,
  ]);

  const attendanceCards = useSelector(getSlotsWithAttendance());
  const allCustomers = useSelector(getCustomersList(true));

  const printButton = (
    <IconButton component={Link} to="/attendance_printable" size="large">
      <PrintIcon />
    </IconButton>
  );

  return (
    <Layout isAdmin adminLinks={adminLinks}>
      <DateNavigation extraButtons={printButton} jump="day">
        {() => (
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
        )}
      </DateNavigation>
    </Layout>
  );
};

const useStyles = makeStyles(() => ({
  root: {
    padding: "0.25rem",
  },
}));

export default DashboardPage;
