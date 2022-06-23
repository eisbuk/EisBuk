import fs from "fs/promises";
import path from "path";

import { FsErrors } from "../lib/types";

import * as restoreService from "../firestore/restore";
import { exists } from "../lib/helpers";

/**
 * Get config option
 */
export default async function restore(filePath: string): Promise<void> {
  try {
    await restoreSingleOrgFromFs(filePath);
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * restoreSingleOrgFromFs - Read an organizations data from JSON & write it back to the db
 * @param {string} filePath - Path to an organizations JSON file
 */
export async function restoreSingleOrgFromFs(filePath: string): Promise<void> {
  const currentDir = process.cwd();
  const resolvedPath = path.resolve(currentDir, filePath);

  try {
    const fileExists = await exists(resolvedPath);

    if (!fileExists) {
      throw new Error(FsErrors.FILE_NOT_FOUND);
    }

    if (path.extname(filePath) !== ".json") {
      throw new Error(FsErrors.INVALID_FILE);
    }

    const data = await fs.readFile(resolvedPath, "utf-8");
    const dataObj = JSON.parse(data);

    // TODO: Validate org data before writing => it should only have id, data & subcollections keys
    // TODO: Validate subcollections too?
    const restoreOp = await restoreService.restoreOrganizations([dataObj]);

    if (!restoreOp.ok) {
      throw new Error(restoreOp.message);
    }

    console.log("Organization successfully restored.");
  } catch (err: any) {
    throw new Error(err.message);
  }
}
