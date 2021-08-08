import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { ETheme } from "@/themes";

import DateNavigationAppBar from "@/containers/DateNavigationAppBar";
import BookingsByDay from "@/components/BookingsByDay";
import AppbarAdmin from "@/components/layout/AppbarAdmin";

import { markAbsentee } from "@/store/actions/bookingOperations";

import { bookingDayInfoSelector } from "@/store/selectors/slots";
import { getCalendarDay } from "@/store/selectors/app";

import useTitle from "@/hooks/useTitle";

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const dispatch = useDispatch();

  useTitle(t("DashboardPage.Bookings"));

  const currentDate = useSelector(getCalendarDay);
  const monthStr = currentDate.toISO().substring(0, 10);
  const bookingDayInfo = useSelector(bookingDayInfoSelector(monthStr));

  const dispatchMarkAbsentee = (args: Parameters<typeof markAbsentee>[0]) =>
    dispatch(markAbsentee(args));

  return (
    <div className={classes.root}>
      <AppbarAdmin />
      <DateNavigationAppBar jump="day" />
      <BookingsByDay
        bookingDayInfo={bookingDayInfo}
        markAbsentee={dispatchMarkAbsentee}
      />
    </div>
  );
};

const useStyles = makeStyles((theme: ETheme) => ({
  appBarSpacer: theme.mixins.toolbar,
  root: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
  },
}));

export default DashboardPage;
