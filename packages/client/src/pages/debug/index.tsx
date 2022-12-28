import React from "react";
import { useSelector } from "react-redux";
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
  Layout,
} from "@eisbuk/ui";

import { CloudFunction } from "@/enums/functions";

import BirthdayMenu from "@/components/atoms/BirthdayMenu";

import { NotificationsContainer } from "@/features/notifications/components";

import useTitle from "@/hooks/useTitle";

import { getCustomersByBirthday } from "@/store/selectors/customers";

import { createCloudFunctionCaller } from "@/utils/firebase";

import { adminLinks } from "@/data/navigation";
import { DateTime } from "luxon";

const auth = getAuth();

/**
 * Creates a new (dummy) organization in firestore
 * and populates it with two dummy (admin) users
 * @returns
 */
export const createAdminTestUsers = async (): Promise<void> => {
  await createCloudFunctionCaller(CloudFunction.CreateOrganization)();
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

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );

  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  return (
    <Layout
      adminLinks={adminLinks}
      isAdmin
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <div className="content-container py-8">
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
            onClick={createCloudFunctionCaller(CloudFunction.CreateTestData, {
              numUsers: 10,
            })}
            color={ButtonColor.Primary}
          >
            Create test users
          </DebugPageButton>
        </div>

        <div className="p-2">
          <DebugPageButton
            onClick={createCloudFunctionCaller(CloudFunction.CreateTestSlots)}
            color={ButtonColor.Primary}
          >
            Create test slots
          </DebugPageButton>
        </div>

        <div className="p-2">
          <DebugPageButton
            onClick={createCloudFunctionCaller(CloudFunction.PruneSlotsByDay)}
            color={ButtonColor.Primary}
          >
            Prune slots by day
          </DebugPageButton>
        </div>

        <div className="p-2">
          <DebugPageButton
            onClick={createCloudFunctionCaller(
              CloudFunction.DeleteOrphanedBookings
            )}
            color={ButtonColor.Primary}
          >
            Delete orphaned bookings
          </DebugPageButton>
        </div>

        <div className="p-2">
          <DebugPageButton
            onClick={createCloudFunctionCaller(
              CloudFunction.MigrateCategoriesToExplicitMinors
            )}
            color={ButtonColor.Primary}
          >
            Migrate categories to explicit minors
          </DebugPageButton>
        </div>
        <div className="p-2">
          <DebugPageButton
            onClick={createCloudFunctionCaller(
              CloudFunction.CustomersToPluralCategories
            )}
            color={ButtonColor.Primary}
          >
            Migrate categories to array
          </DebugPageButton>
        </div>
        <div className="p-2">
          <DebugPageButton
            onClick={createCloudFunctionCaller(
              CloudFunction.PopulateDefaultEmailTemplates
            )}
            color={ButtonColor.Primary}
          >
            Populate Default Email Templates
          </DebugPageButton>
        </div>
      </div>
    </Layout>
  );
};

export default DebugPage;
