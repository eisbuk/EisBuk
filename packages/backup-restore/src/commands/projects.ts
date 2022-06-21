import { configstore, ConfigOptions } from "../configstore";

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
export function addProjectCredentials(): void {}

/**
 * Remov firebase project credentials from XDG-specific AppData locaiton
 */
export function removeProjectCredentials(): void {}
