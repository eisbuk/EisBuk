import fs from "fs/promises";
import { constants } from "fs";

/**
 * exists - fs helper to check if a file exists at a specified path before trying to read it
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
