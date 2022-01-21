/* eslint-disable no-catch-shadow */
import * as fs from "fs";
import * as path from "path";

import { FirestoreDataUpdate } from "../types";

/**
 * A utility function that reads the provided test file from the provided
 * test data directory. After reading the file, returns the expected collections
 * (if any) in form of `{[collection]: collectionData}` object
 * @param dir absolute path to `__testData__` directory
 * @param fName name of the test data file to read and parse
 * @returns `{[collection]: collectionData}` object
 */
const readTestData = async (
  dir: string,
  fName: string
): Promise<FirestoreDataUpdate> => {
  // trim ".json" (if included in the filename)
  // and add ".json" at the end (to ensure the files has only one ".json" extension)
  const jsonFName = fName.replace(".json", "") + ".json";
  const fPath = path.join(dir, jsonFName);

  const parsedFile = await new Promise<FirestoreDataUpdate>((res) =>
    fs.readFile(fPath, (err, buff) => {
      if (err) {
        console.error(`Error reading ${jsonFName}`, err);
        res({});
      }
      try {
        // try and parse the buffer
        const jsonData = JSON.parse(buff.toString());
        res(jsonData);
      } catch (err) {
        console.error(`Error parsing ${jsonFName}`, err);
        res({});
      }
    })
  );

  return {
    attendance: parsedFile.attendance,
    bookings: parsedFile.bookings,
    customers: parsedFile.customers,
    slots: parsedFile.slots,
  };
};

export default readTestData;
