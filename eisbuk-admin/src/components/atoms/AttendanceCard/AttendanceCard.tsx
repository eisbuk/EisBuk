import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import i18n from "i18next";

import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import AddNew from "@material-ui/icons/AddCircle";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Category, SlotType, Customer, SlotInterface } from "eisbuk-shared";

import { CategoryLabel, SlotTypeLabel } from "@/enums/translations";

import { CustomerWithAttendance } from "@/types/components";

import UserAttendance from "@/components/atoms/AttendanceCard/UserAttendance";
import AddCustomersList from "./AddCustomers";

import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";

import { getSlotTimespan } from "@/utils/helpers";

import { ETheme } from "@/themes";

import { __addCustomersButtonId__ } from "./__testData__/testIds";
import Divider from "@material-ui/core/Divider";

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
  customers,
  intervals,
  type,
  id: slotId,
  allCustomers,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const timeString = getSlotTimespan(intervals);

  /**
   * We don't need the interval record, but rather a sorted array of interval keys.
   * We're confident interval values won't change inside attendance view so it's ok to
   * memoize the array for lifetime of the component
   */
  const orderedIntervals = useMemo(
    () => Object.keys(intervals).sort((a, b) => (a < b ? -1 : 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
          !customers.find(({ id: customerId }) => customerId === id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers]
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
              {timeString} <b>({customers.length})</b>
            </span>
          }
          secondary={translateAndJoinTags(categories, type)}
        />
      </ListItem>
      {customers.map(
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
      {customers.map(
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

// #region localUtils
const translateAndJoinTags = (categories: Category[], type: SlotType) => {
  const translatedCategories = categories.map((category) =>
    i18n.t(CategoryLabel[category])
  );
  const translatedType = i18n.t(SlotTypeLabel[type]);

  return `${[...translatedCategories, translatedType].join(" ")}`;
};
// #endregion localUtils

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
}));
// #endregion Styles
export default AttendanceCard;
