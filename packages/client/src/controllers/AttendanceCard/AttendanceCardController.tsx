import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import {
  CustomerFull,
  SlotInterface,
  CustomerWithAttendance,
} from "@eisbuk/shared";
import { AttendanceCardContainer, UserAttendance, Divider } from "@eisbuk/ui";

import {
  markAbsence,
  markAttendance,
} from "@/store/actions/attendanceOperations";

import { createModal } from "@/features/modal/useModal";

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
  const { customers: attendedCustomers, intervals, id: slotId } = slot;

  const dispatch = useDispatch();

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
    <AttendanceCardContainer
      numAttended={attendedCustomers.length}
      slot={slot}
      onAddCustomers={openAddCustomers}
    >
      {attendedCustomers.map(
        (customer) =>
          customer.bookedInterval && (
            <Link
              key={customer.id}
              to={`${PrivateRoutes.Athletes}/${customer.id}`}
            >
              <UserAttendance
                {...customer}
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

      <Divider />

      {attendedCustomers.map(
        (customer) =>
          !customer.bookedInterval && (
            <Link
              key={customer.id}
              to={`${PrivateRoutes.Athletes}/${customer.id}`}
            >
              <UserAttendance
                {...customer}
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
    </AttendanceCardContainer>
  );
};

const useAddCustomersModal = createModal("AddAttendedCustomersDialog");

export default AttendanceCard;
