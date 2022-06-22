import fs from "fs/promises";
import path from "path";

import { ServiceAccount } from "firebase-admin";

import { exists } from "../helpers";
import { configstore, ConfigOptions } from "../config/configstore";
import { paths } from "../config/paths";

import { FsErrors } from "../types";

/**
 * List project IDs of available firebase credentials
 */
export function listProjectCredentials(): void {
  const projects = configstore.get(ConfigOptions.Projects);
  console.log(projects);
}

/**
 * Add firebase project credentials to XDG-specific AppData locaiton
 */
export async function addProjectCredentials(filePath: string): Promise<void> {
  // Resolve path to file and check it exists
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

    // Copy file, and extract projectId
    const serviceAccountJson = await fs.readFile(filePath, "utf-8");

    // TODO: Validate json

    const { projectId } = JSON.parse(serviceAccountJson) as ServiceAccount;

    const writePath = `${paths.data}/${projectId}.json`;

    const hasAppDataDir = await exists(paths.data);
    if (hasAppDataDir) {
      fs.mkdir(paths.data);
    }

    await fs.writeFile(writePath, serviceAccountJson, "utf-8");

    // Update config
    const projects = configstore.get(ConfigOptions.Projects) as Array<string>;

    const newProjectsList = [projectId, ...projects];

    configstore.set(ConfigOptions.Projects, newProjectsList);
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * Remov firebase project credentials from XDG-specific AppData locaiton
 */
export function removeProjectCredentials(): void {}
