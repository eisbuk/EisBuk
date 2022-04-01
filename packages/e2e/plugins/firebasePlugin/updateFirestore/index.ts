import * as path from "path";

import { TaskHandler } from "../types";

import readTestData from "./readTestData";
import updateFirestoreData from "./updateFirestoreData";

interface UpdateFirestorePayload {
  organization: string;
  files: string[];
}

const handleFirestoreUpdate: TaskHandler<UpdateFirestorePayload> = async ({
  organization,
  files,
}) => {
  const testFilesDir = path.join(__dirname, "..", "..", "..", "__testData__");

  const docsToUpdate = await readTestData(testFilesDir, files);

  await updateFirestoreData(organization, docsToUpdate);

  return null;
};

export default handleFirestoreUpdate;
