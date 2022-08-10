import fs from "fs/promises";
import path from "path";

import { exists } from "../lib/helpers";
import { paths } from "../lib/paths";

import { IServiceAccountJson } from "../lib/firebase";
import { FsErrors } from "../lib/types";

/**
 * List project IDs of available firebase credentials
 */
export async function listProjectCredentials(): Promise<void> {
  const projects = await fs.readdir(paths.data);
  console.log(projects);
}

// TODO: following two functions could be fragmented and tested better
/**
 * Add firebase project credentials to XDG-specific AppData location
 */
export async function addProjectCredentials(filePath: string): Promise<void> {
  // Resolve path to file and check it exists
  const resolvedPath = path.resolve(filePath);

  try {
    if (path.extname(filePath) !== ".json") {
      throw new Error(FsErrors.INVALID_FILE);
    }

    // Copy file, and extract projectId
    const serviceAccountJson = await fs.readFile(resolvedPath, "utf-8");

    // TODO: Validate json

    // eslint-disable-next-line
    const { project_id } = JSON.parse(
      serviceAccountJson
    ) as IServiceAccountJson;

    // eslint-disable-next-line
    const writePath = `${paths.data}/${project_id}-credentials.json`;

    const hasAppDataDir = await exists(paths.data);
    if (!hasAppDataDir) {
      fs.mkdir(paths.data, { recursive: true });
    }

    await fs.writeFile(writePath, serviceAccountJson, "utf-8");
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * Remov firebase project credentials from XDG-specific AppData location
 */
export async function removeProjectCredentials(
  projectId: string
): Promise<void> {
  try {
    // Check credentials.json exists, and if so remove it
    const credentialsPath = `${paths.data}/${projectId}-credentials.json`;

    await fs.rm(credentialsPath);
  } catch (err: any) {
    console.error(err);
  }
}
