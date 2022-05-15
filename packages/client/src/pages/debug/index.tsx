import React from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "@firebase/auth";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { CloudFunction } from "@/enums/functions";

import AppbarAdmin from "@/components/layout/AppbarAdmin";

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
  useTitle("Debug");
  return (
    <Container maxWidth="sm">
      <AppbarAdmin />
      <Box my={4} color="primary">
        <Button
          onClick={createAdminTestUsers}
          color="secondary"
          variant="contained"
        >
          Create admin test users
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={createCloudFunctionCaller(CloudFunction.CreateTestData, {
            numUsers: 10,
          })}
          color="primary"
          variant="contained"
        >
          Create test users
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={createCloudFunctionCaller(CloudFunction.CreateTestSlots)}
          color="primary"
          variant="contained"
        >
          Create test slots
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={createCloudFunctionCaller(CloudFunction.PruneSlotsByDay)}
          color="primary"
          variant="contained"
        >
          Prune slots by day
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={createCloudFunctionCaller(
            CloudFunction.DeleteOrphanedBookings
          )}
          color="primary"
          variant="contained"
        >
          Delete orphaned bookings
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={createCloudFunctionCaller(
            CloudFunction.MigrateCategoriesToExplicitMinors
          )}
          color="primary"
          variant="contained"
        >
          Migrate categories to explicit minors
        </Button>
      </Box>
    </Container>
  );
};
export default DebugPage;
