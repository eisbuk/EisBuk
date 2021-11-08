import React from "react";
import firebase from "firebase/app";

import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";

import { CloudFunction } from "@/enums/functions";

import AppbarAdmin from "@/components/layout/AppbarAdmin";

import useTitle from "@/hooks/useTitle";

import { functionsZone, getOrganization } from "@/config/envInfo";

/**
 * Invokes cloud function
 * @param functionName function to run
 * @returns function that calls firebase with provided functionName param
 */
export const invokeFunction = (functionName: CloudFunction) => {
  return async (): Promise<void> => {
    const res = await firebase
      .app()
      .functions(functionsZone)
      .httpsCallable(functionName)({ organization: getOrganization() });

    console.log(res.data);
  };
};

/**
 * Creates a new (dummy) organization in firestore
 * and populates it with two dummy (admin) users
 * @returns
 */
export const createAdminTestUsers = async (): Promise<void> => {
  await invokeFunction(CloudFunction.CreateOrganization)();
  // Auth emulator is not currently accessible from within the functions
  await firebase
    .auth()
    .createUserWithEmailAndPassword("test@eisbuk.it", "test00");
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
          onClick={invokeFunction(CloudFunction.CreateTestData)}
          color="primary"
          variant="contained"
        >
          Create test users
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={invokeFunction(CloudFunction.CreateTestSlots)}
          color="primary"
          variant="contained"
        >
          Create test slots
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={invokeFunction(CloudFunction.MigrateSlotsToPluralCategories)}
          color="primary"
          variant="contained"
        >
          Migrate slots to plural categories
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={invokeFunction(CloudFunction.CreateStaleTestData)}
          color="primary"
          variant="contained"
        >
          Create old data model entries
        </Button>
      </Box>
      <Box my={4} color="secondary.main">
        <Button
          onClick={invokeFunction(CloudFunction.MigrateToNewDataModel)}
          color="primary"
          variant="contained"
        >
          Migrate to new data model
        </Button>
      </Box>
    </Container>
  );
};
export default DebugPage;
