import fs from "fs/promises";
import path from "path";

import { Command } from "commander";

import * as restoreService from "../../firestore/restoreService";

import { configstore, ConfigOptions } from "../../config/configstore";
import { useConfirmPrompt } from "../../hooks";

import { exists } from "../../lib/helpers";
import { FsErrors } from "../../lib/types";

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

/**
 * Prompts user to confirm potentially destructive restore action before continuing
 */
export async function useConfirmRestore(
  _: Command,
  actionCommand: Command
): Promise<void> {
  const activeProject = configstore.get(ConfigOptions.ActiveProject);

  const [filePath] = actionCommand.args;
  const file = path.basename(filePath);

  const message = `Restoring organization in project: "${activeProject}" with the contents of ${file}.
  Any existing organisation data will be overwritten: Are you sure you want to continue?`;

  await useConfirmPrompt(message);
}
