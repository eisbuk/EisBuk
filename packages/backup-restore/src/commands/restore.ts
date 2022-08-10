import fs from "fs/promises";
import path from "path";

import { Command } from "commander";
import { restore } from "firestore-export-import";

import { Collection } from "@eisbuk/shared";

import { useConfirmPrompt } from "../hooks";

/**
 * Restore command
 */
export default async function (file: string): Promise<void> {
  try {
    const filePath = path.resolve(file);
    const orgJson = await fs.readFile(filePath, "utf-8");

    const orgName = path.basename(file, path.extname(file));
    const orgData = JSON.parse(orgJson);

    const payload = {
      [Collection.Organizations]: {
        [orgName]: orgData,
      },
    };

    await restore(payload);

    console.log("Organization successfully restored.");
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * Prompts user to confirm potentially destructive restore action before continuing
 */
export async function useConfirmRestore(
  thisCommand: Command,
  actionCommand: Command
): Promise<void> {
  const { project } = thisCommand.opts();

  const [filePath] = actionCommand.args;
  const file = path.basename(filePath);

  const message = `Restoring organization in project: "${project}" with the contents of ${file}.
  Any existing organisation data will be overwritten: Are you sure you want to continue?`;

  await useConfirmPrompt(message);
}
