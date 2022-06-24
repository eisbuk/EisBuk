import fs from "fs/promises";
import path from "path";

import { exists } from "../lib/helpers";
import { configstore, ConfigOptions } from "../config/configstore";
import { paths } from "../config/paths";

import { IServiceAccountJson } from "../lib/firebase";
import { FsErrors } from "../lib/types";

/**
 * List project IDs of available firebase credentials
 */
export function listProjectCredentials(): void {
  const projects = configstore.get(ConfigOptions.Projects);
  console.log(projects);
}

// TODO: following two functions could be fragmented and tested better
/**
 * Add firebase project credentials to XDG-specific AppData location
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

    const { project_id } = JSON.parse(
      serviceAccountJson
    ) as IServiceAccountJson;

    const writePath = `${paths.data}/${project_id}-credentials.json`;

    const hasAppDataDir = await exists(paths.data);
    if (hasAppDataDir) {
      fs.mkdir(paths.data, { recursive: true });
    }

    await fs.writeFile(writePath, serviceAccountJson, "utf-8");

    // Update config
    const projects = configstore.get(ConfigOptions.Projects) as Array<string>;

    const newProjectsList = [project_id, ...projects];

    configstore.set(ConfigOptions.Projects, newProjectsList);
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

    const hasCredentials = await exists(credentialsPath);

    if (!hasCredentials) {
      throw new Error(FsErrors.FILE_NOT_FOUND);
    }

    await fs.rm(credentialsPath);

    // Update config
    const projects = configstore.get(ConfigOptions.Projects) as Array<string>;

    const newProjectsList = projects.filter((id) => id !== projectId);

    configstore.set(ConfigOptions.Projects, newProjectsList);

    // If this was activeProject, set active to null
    const activeProject = configstore.get(
      ConfigOptions.ActiveProject
    ) as string;

    if (activeProject === projectId) {
      configstore.set(ConfigOptions.ActiveProject, null);
    }
  } catch (err: any) {
    console.error(err);
  }
}
