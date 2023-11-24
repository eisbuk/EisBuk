import React from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "@firebase/auth";

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

const auth = getAuth();

/**
 * Creates a new (dummy) organization in firestore
 * and populates it with two dummy (admin) users
 * @returns
 */
export const createAdminTestUsers = async (): Promise<void> => {
  await createFunctionCaller(functions, CloudFunction.CreateOrganization, {
    displayName: "EisBuk Dev",
  })();
  // Auth emulator is not currently accessible from within the functions
  try {
    await createUserWithEmailAndPassword(auth, "test@eisbuk.it", "test00");
  } catch (e) {
    await signInWithEmailAndPassword(auth, "test@eisbuk.it", "test00");
  }
};

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
              onClick={createAdminTestUsers}
              color={ButtonColor.Secondary}
            >
              Create admin test users
            </DebugPageButton>
          </div>

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
                  CloudFunction.CalculateBookingStats
                )().then(console.log)
              }
              color={ButtonColor.Primary}
            >
              Calculate booking stats
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
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default DebugPage;
