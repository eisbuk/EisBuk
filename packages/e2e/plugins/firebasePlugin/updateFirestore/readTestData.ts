/* eslint-disable no-catch-shadow */
import * as fs from "fs";
import * as path from "path";

import { FirestoreDataUpdate } from "../types";

/**
 * A utility function that reads from provided test file(s) from the provided
 * test data directory. After reading the file(s), returns the combined expected collections
 * (if any) in form of `{[collection]: collectionData}` object
 * @param dir absolute path to `__testData__` directory
 * @param fName name of the test data file to read and parse
 * @returns `{[collection]: collectionData}` object
 */
const readTestData = async (
  dir: string,
  files: string[]
): Promise<FirestoreDataUpdate> => {
  // read and parse the files
  const parsedFiles = await Promise.all(
    files.map((fName) => {
      const fPath = path.join(dir, fName);

      return new Promise<FirestoreDataUpdate>((resolve) =>
        fs.readFile(fPath, (err, buff) => {
          if (err) {
            console.error(`Error reading ${fName}`, err);
            resolve({});
          }
          try {
            // try and parse the buffer
            const jsonData = JSON.parse(buff.toString());
            resolve(jsonData);
          } catch (err) {
            console.error(`Error parsing ${fName}`, err);
            resolve({});
          }
        })
      );
    })
  );

  // reduce files to single update structure
  return parsedFiles.reduce((acc, parsedFile) => combineFiles(acc, parsedFile));
};

/**
 * Combines collections of two firestore update files by combining each collection
 * from both file1 and file2 (if present)
 * @param file1
 * @param file2
 * @returns combined firestore data update file
 */
const combineFiles = (file1: FirestoreDataUpdate, file2: FirestoreDataUpdate) =>
  ["attendnace", "bookings", "customers", "slots"].reduce(
    (acc, coll) => ({
      ...acc,
      [coll]: { ...file1[coll], ...file2[coll] },
    }),
    {}
  );

export default readTestData;
