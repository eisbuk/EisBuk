import React from "react";
import firebase from "firebase/app";
import { Container, Box, Button } from "@material-ui/core";

import { CloudFunction } from "@/enums/functions";

import AppbarAdmin from "@/components/layout/AppbarAdmin";

import { useTitle } from "@/utils/helpers";

import { functionsZone, ORGANIZATION } from "@/config/envInfo";

/**
 * Invokes cloud function
 * @param functionName function to run
 * @returns function that calls firebase with provided functionName param
 */
const invokeFunction = (functionName: CloudFunction) => {
  return async () => {
    const res = await firebase
      .app()
      .functions(functionsZone)
      .httpsCallable(functionName)({ organization: ORGANIZATION });

    console.log(res.data);
  };
};

/**
 * creates admin test users
 * @returns
 */
const createAdminTestUsers = () => {
  invokeFunction(CloudFunction.CreateOrganization)();
  // Auth emulator is not currently accessible from within the functions
  firebase.auth().createUserWithEmailAndPassword("test@eisbuk.it", "test00");
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
    </Container>
  );
};
export default DebugPage;
