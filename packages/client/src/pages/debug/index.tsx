import React from "react";
import { useSelector } from "react-redux";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "@firebase/auth";

import { Button, ButtonColor, ButtonSize, Layout } from "@eisbuk/ui";

import { NavigationLabel, useTranslation } from "@eisbuk/translations";

import { Calendar } from "@eisbuk/svg";

import { getIsAdmin } from "@/store/selectors/auth";

import { CloudFunction } from "@/enums/functions";
import { PrivateRoutes } from "@/enums/routes";

import useTitle from "@/hooks/useTitle";

import { createCloudFunctionCaller } from "@/utils/firebase";

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

const DebugPage: React.FC = () => {
  const isAdmin = useSelector(getIsAdmin);

  const { t } = useTranslation();

  const adminLinks = [
    {
      label: t(NavigationLabel.Attendance),
      Icon: Calendar,
      slug: PrivateRoutes.Root,
    },
    {
      label: "Slots",
      Icon: Calendar,
      slug: PrivateRoutes.Slots,
    },
    {
      label: t(NavigationLabel.Athletes),
      Icon: Calendar,
      slug: PrivateRoutes.Athletes,
    },
  ];
  useTitle("Debug");

  return (
    <Layout adminLinks={adminLinks} isAdmin={isAdmin}>
      <div className="content-container py-8">
        <div className="p-2">
          <Button
            onClick={createAdminTestUsers}
            color={ButtonColor.Secondary}
            size={ButtonSize.LG}
          >
            Create admin test users
          </Button>
        </div>

        <div className="p-2">
          <Button
            onClick={createCloudFunctionCaller(CloudFunction.CreateTestData, {
              numUsers: 10,
            })}
            color={ButtonColor.Primary}
            size={ButtonSize.LG}
          >
            Create test users
          </Button>
        </div>

        <div className="p-2">
          <Button
            onClick={createCloudFunctionCaller(CloudFunction.CreateTestSlots)}
            color={ButtonColor.Primary}
            size={ButtonSize.LG}
          >
            Create test slots
          </Button>
        </div>

        <div className="p-2">
          <Button
            onClick={createCloudFunctionCaller(CloudFunction.PruneSlotsByDay)}
            color={ButtonColor.Primary}
            size={ButtonSize.LG}
          >
            Prune slots by day
          </Button>
        </div>

        <div className="p-2">
          <Button
            onClick={createCloudFunctionCaller(
              CloudFunction.DeleteOrphanedBookings
            )}
            color={ButtonColor.Primary}
            size={ButtonSize.LG}
          >
            Delete orphaned bookings
          </Button>
        </div>

        <div className="p-2">
          <Button
            onClick={createCloudFunctionCaller(
              CloudFunction.MigrateCategoriesToExplicitMinors
            )}
            color={ButtonColor.Primary}
            size={ButtonSize.LG}
          >
            Migrate categories to explicit minors
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default DebugPage;
