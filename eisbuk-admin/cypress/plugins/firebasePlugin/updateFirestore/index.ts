import * as path from "path";

import { TaskHandler } from "../types";

import readTestData from "./readTestData";
import updateFirestoreData from "./updateFirestoreData";

interface Payload {
  organization: string;
  fName: string;
}

const handleFirestoreUpdate: TaskHandler<Payload> = async ({
  organization,
  fName,
}) => {
  const testFilesDir = path.join(__dirname, "..", "..", "..", "__testData__");

  const docsToUpdate = await readTestData(testFilesDir, fName);

  await updateFirestoreData(organization, docsToUpdate);

  return null;
};

export default handleFirestoreUpdate;
