import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

import AddNew from "@mui/icons-material/AddCircle";

import makeStyles from "@mui/styles/makeStyles";

import i18n, {
  AttendanceAria,
  CategoryLabel,
  SlotTypeLabel,
  useTranslation,
} from "@eisbuk/translations";
import { CustomerFull, SlotInterface } from "@eisbuk/shared";

import { CustomerWithAttendance } from "@/types/components";

import { ETheme } from "@/themes";

import UserAttendance from "@/components/atoms/AttendanceCard/UserAttendance";

import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";

import { createModal } from "@/features/modal/useModal";

import { getSlotTimespan } from "@/utils/helpers";
import { comparePeriods } from "@/utils/sort";
import { PrivateRoutes } from "@/enums/routes";

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
  allCustomers: CustomerFull[];
}

/**
 * Attendance card for particular slot, used in order for admin
 * to be able to mark customer as being present and for which duration
 * for a particular slot. By default it shows all the customers who have
 * booked the slot and allows for manually adding customers who have not booked,
 * but have attended the slot for certain interval
 */
const AttendanceCard: React.FC<Props> = ({ allCustomers, ...slot }) => {
  const {
    categories,
    customers: attendedCustomers,
    intervals,
    type,
    id: slotId,
  } = slot;

  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useTranslation();

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
   * Filtered customers to show in add customers list.
   * We're filtering customers not belonging to slot's categories
   * by checking whether customer category array contains any of the allowed categories
   * also those already marked as attended
   */
  //
  const filteredCustomers = useMemo(
    () =>
      allCustomers.filter(
        ({ categories, id }) =>
          categories.some((allowedCategory) =>
            categories.includes(allowedCategory)
          ) &&
          !attendedCustomers.find(({ id: customerId }) => customerId === id)
      ),
    [attendedCustomers]
  );

  const { open: openAddCustomers } = useAddCustomersModal({
    ...slot,
    customers: filteredCustomers,
    defaultInterval: orderedIntervals[0],
  });

  const createAttendanceThunk = (
    params: Omit<Parameters<typeof markAttendance>[0], "slotId">
  ) => markAttendance({ slotId, ...params });

  const createAbsenceThunk = (
    params: Omit<
      Parameters<typeof markAttendance>[0],
      "slotId" | "attendedInterval"
    >
  ) => markAbsence({ ...params, slotId });

  return (
    <div aria-label="attendance-card" className={classes.container}>
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
            <Link to={`${PrivateRoutes.Athletes}/${customer.id}`}>
              <UserAttendance
                {...customer}
                key={customer.id}
                intervals={orderedIntervals}
                markAttendance={({ attendedInterval }) =>
                  dispatch(
                    createAttendanceThunk({
                      customerId: customer.id,
                      name: customer.name,
                      surname: customer.surname,
                      attendedInterval,
                    })
                  )
                }
                markAbsence={() =>
                  dispatch(
                    createAbsenceThunk({
                      customerId: customer.id,
                      name: customer.name,
                      surname: customer.surname,
                    })
                  )
                }
              />
            </Link>
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
                  createAttendanceThunk({
                    customerId: customer.id,
                    name: customer.name,
                    surname: customer.surname,
                    attendedInterval,
                  })
                )
              }
              markAbsence={() =>
                dispatch(
                  createAbsenceThunk({
                    customerId: customer.id,
                    name: customer.name,
                    surname: customer.surname,
                  })
                )
              }
            />
          )
      )}
      <IconButton
        aria-label={t(AttendanceAria.AddAttendedCustomers)}
        className={classes.addCustomersButton}
        onClick={openAddCustomers}
        size="large"
      >
        <AddNew />
      </IconButton>
    </div>
  );
};

const useAddCustomersModal = createModal("AddAttendedCustomersDialog");

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
