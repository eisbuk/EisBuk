import React from "react";

import {
  Button,
  ButtonColor,
  ButtonProps,
  ButtonSize,
  LayoutContent,
} from "@eisbuk/ui";
import { CloudFunction } from "@eisbuk/shared/ui";

import { functions } from "@/setup";

import Layout from "@/controllers/Layout";

import useTitle from "@/hooks/useTitle";

import { createFunctionCaller } from "@/utils/firebase";

const DebugPageButton: React.FC<Pick<ButtonProps, "color" | "onClick">> = ({
  color = ButtonColor.Primary,
  ...props
}) => (
  <Button
    className="active:opacity-80"
    {...props}
    color={color}
    size={ButtonSize.LG}
  />
);

const DebugPage: React.FC = () => {
  useTitle("Debug");

  return (
    <Layout>
      <LayoutContent>
        <div className="py-8">
          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.CreateTestData,
                {
                  numUsers: 10,
                }
              )}
              color={ButtonColor.Primary}
            >
              Create test users
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.CreateTestSlots
              )}
              color={ButtonColor.Primary}
            >
              Create test slots
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.PruneSlotsByDay
              )}
              color={ButtonColor.Primary}
            >
              Prune slots by day
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.DeleteOrphanedBookings
              )}
              color={ButtonColor.Primary}
            >
              Delete orphaned bookings
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.PopulateDefaultEmailTemplates
              )}
              color={ButtonColor.Primary}
            >
              Populate Default Email Templates
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.RemoveInvalidCustomerPhones
              )}
              color={ButtonColor.Primary}
            >
              Remove Invalid Customer Phones
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.ClearDeletedCustomersRegistrationAndCategories
              )}
              color={ButtonColor.Primary}
            >
              Clear Deleted Customers Registration And Categories
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={createFunctionCaller(
                functions,
                CloudFunction.NormalizeExistingEmails
              )}
              color={ButtonColor.Primary}
            >
              Normalize Existing Emails
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.CalculateBookingStatsThisAndNextMonths
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              Calculate Booking Stats for Current and the Following Month
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBSlotAttendanceCheck
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Slot / Attendance Check
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBSlotAttendanceAutofix
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Slot / Attendance Autofix
            </DebugPageButton>
          </div>
          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBSlotBookingsCheck
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Slot / Bookings Check
            </DebugPageButton>
          </div>
          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBSlotBookingsAutofix
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Slot / Bookings Autofix
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBSlotSlotsByDayCheck
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Slot / SlotsByDay Check
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBSlotSlotsByDayAutofix
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Slot / SlotsByDay Autofix
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBBookedSlotsAttendanceCheck
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Booked slots / Attendance Check
            </DebugPageButton>
          </div>

          <div className="p-2">
            <DebugPageButton
              onClick={() =>
                createFunctionCaller(
                  functions,
                  CloudFunction.DBBookedSlotsAttendanceAutofix
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              DB Booked slots / Attendance Autofix
            </DebugPageButton>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default DebugPage;
