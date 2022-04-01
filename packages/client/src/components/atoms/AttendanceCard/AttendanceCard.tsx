import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

import AddNew from "@mui/icons-material/AddCircle";

import makeStyles from "@mui/styles/makeStyles";

import { Customer, SlotInterface } from "@eisbuk/shared";
import i18n, { CategoryLabel, SlotTypeLabel } from "@eisbuk/translations";

import { CustomerWithAttendance } from "@/types/components";

import UserAttendance from "@/components/atoms/AttendanceCard/UserAttendance";
import AddCustomersList from "./AddCustomers";

import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";

import { comparePeriods, getSlotTimespan } from "@/utils/helpers";

import { ETheme } from "@/themes";

import { __addCustomersButtonId__ } from "./__testData__/testIds";

export interface Props extends SlotInterface {
  /**
   * Record of customers who have booked (or are manually as attended),
   * keyed by `customerId` and having all of the data for the customer plus
   * values for `bookedInterval` and `attendedInterval`.
   */
  customers: CustomerWithAttendance[];
  /**
   * List of all of the customers from the store. We're using this to filter
   * the list and display on add customers list
   */
  allCustomers: Customer[];
}

/**
 * Attendance card for particular slot, used in order for admin
 * to be able to mark customer as being present and for which duration
 * for a particular slot. By default it shows all the customers who have
 * booked the slot and allows for manually adding customers who have not booked,
 * but have attended the slot for certain interval
 */
const AttendanceCard: React.FC<Props> = ({
  categories,
  customers: attendedCustomers,
  intervals,
  type,
  id: slotId,
  allCustomers,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const timeString = getSlotTimespan(intervals);

  // categories and type UI elements
  const tags = (
    <>
      <span className={classes.tagsContainer}>
        {categories.map((category) => (
          <span
            key={category}
            className={[classes.tag, classes.category].join(" ")}
          >
            {i18n.t(CategoryLabel[category])}
          </span>
        ))}
      </span>
      <span className={[classes.tag, classes.type].join(" ")}>
        {i18n.t(SlotTypeLabel[type])}
      </span>
    </>
  );

  /**
   * We don't need the interval record, but rather a sorted array of interval keys.
   * We're confident interval values won't change inside attendance view so it's ok to
   * memoize the array for lifetime of the component
   */
  const orderedIntervals = useMemo(
    () => Object.keys(intervals).sort(comparePeriods),
    [intervals]
  );

  /**
   * State we're using to control opening of customer list when adding customers who haven't booked,
   * but have attended
   */
  const [addCustomers, setAddCustomers] = useState<boolean>(false);

  /**
   * Filtered customers to show in add customers list.
   * We're filtering customers not belonging to slot's categories
   * and those already marked as attended
   */
  const filteredCustomers = useMemo(
    () =>
      allCustomers.filter(
        ({ category, id }) =>
          categories.includes(category) &&
          !attendedCustomers.find(({ id: customerId }) => customerId === id)
      ),
    [attendedCustomers]
  );

  /**
   * Function we're passing down to add customers list to handle marking customers as attended
   */
  const handleAddCustomer = (customer: Customer) => {
    const { id: customerId } = customer;
    const attendedInterval = orderedIntervals[0];
    // dispatch update to firestore
    dispatch(markAttendance({ customerId, slotId, attendedInterval }));
  };

  return (
    <div className={classes.container}>
      <ListItem className={classes.listHeader}>
        <ListItemText
          primary={
            <span>
              {timeString} <b>({attendedCustomers.length})</b>
            </span>
          }
          secondary={tags}
        />
      </ListItem>
      {attendedCustomers.map(
        (customer) =>
          customer.bookedInterval && (
            <UserAttendance
              {...customer}
              key={customer.id}
              intervals={orderedIntervals}
              markAttendance={({ attendedInterval }) =>
                dispatch(
                  markAttendance({
                    attendedInterval,
                    slotId,
                    customerId: customer.id,
                  })
                )
              }
              markAbsence={() =>
                dispatch(
                  markAbsence({
                    slotId,
                    customerId: customer.id,
                  })
                )
              }
            />
          )
      )}
      <Divider className={classes.thickerDivider} />
      {attendedCustomers.map(
        (customer) =>
          !customer.bookedInterval && (
            <UserAttendance
              {...customer}
              key={customer.id}
              intervals={orderedIntervals}
              markAttendance={({ attendedInterval }) =>
                dispatch(
                  markAttendance({
                    attendedInterval,
                    slotId,
                    customerId: customer.id,
                  })
                )
              }
              markAbsence={() =>
                dispatch(
                  markAbsence({
                    slotId,
                    customerId: customer.id,
                  })
                )
              }
            />
          )
      )}
      <IconButton
        className={classes.addCustomersButton}
        onClick={() => setAddCustomers(true)}
        data-testid={__addCustomersButtonId__}
        size="large"
      >
        <AddNew />
      </IconButton>
      <AddCustomersList
        open={addCustomers}
        onClose={() => setAddCustomers(false)}
        customers={filteredCustomers}
        onAddCustomer={handleAddCustomer}
      />
    </div>
  );
};

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  listHeader: {
    backgroundColor: theme.palette.primary.light,
  },
  container: {
    marginBottom: theme.spacing(2),
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: "0.5rem",
    overflow: "hidden",
    borderColor: theme.palette.primary.main,
  },
  addCustomersButton: {
    width: "100%",
    height: "3rem",
    borderRadius: 0,
  },
  thickerDivider: {
    height: 1,
    backgroundColor: theme.palette.primary.dark,
    marginBottom: 5,
  },
  tagsContainer: { marginRight: "0.25rem" },
  tag: {
    boxSizing: "border-box",
    padding: "0.125rem 0.5rem",
    margin: "0 0.125rem",
    border: "none",
    borderRadius: 4,
    color: theme.palette.secondary.contrastText,
  },
  category: {
    background: theme.palette.secondary.dark,
  },
  type: {
    background: theme.palette.secondary.light,
  },
}));
// #endregion Styles
export default AttendanceCard;