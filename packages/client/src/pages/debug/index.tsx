import React from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "@firebase/auth";

import { Button, ButtonColor, ButtonSize, Layout } from "@eisbuk/ui";

import { CloudFunction } from "@/enums/functions";

import useTitle from "@/hooks/useTitle";

import { createCloudFunctionCaller } from "@/utils/firebase";

import { adminLinks } from "@/data/navigation";

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
  useTitle("Debug");

  return (
    <Layout adminLinks={adminLinks} isAdmin>
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
