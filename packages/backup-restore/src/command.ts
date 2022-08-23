import { Command } from "commander";

import backup from "./commands/backup";
import restore, { useConfirmRestore } from "./commands/restore";
import {
  listProjectCredentials,
  addProjectCredentials,
  removeProjectCredentials,
} from "./commands/projects";
import { useFirebase } from "./hooks";

interface programOptions {
  exitOverride?: boolean;
  suppressOutput?: boolean;
}

/**
 * makeProgram - Program factory
 * @param options - Commander program overrides
 * @returns
 */
export function makeProgram(
  options: programOptions = { exitOverride: false, suppressOutput: false }
): Command {
  const program = new Command();

  // Configuration
  if (options?.exitOverride) {
    program.exitOverride();
  }
  if (options?.suppressOutput) {
    program.configureOutput({
      writeOut: () => {},
      writeErr: () => {},
    });
  }

  program
    .command("projects:list")
    .description("List project IDs of available firebase credentials")
    .action(listProjectCredentials);

  program
    .command("projects:add")
    .description("Save a projects service account JSON")
    .argument("<filePath>", "Path to firebase service account JSON file")
    .action(addProjectCredentials);

  program
    .command("projects:remove")
    .description("Remove a projects service account JSON")
    .argument("<projectId>", "Firebase service account ID")
    .action(removeProjectCredentials);

  program
    .command("backup")
    .description(
      "Backup organization(s) to JSON in the current working directory."
    )
    .requiredOption(
      "-p, --project <projectId>",
      "ID of the project credentials used as auth against a firestore instance. Credentials should first be stored with `projects:add`"
    )
    .option("-e, --emulators", "use emulator instance / data", false)
    .option("-h, --host", "specify the emulator host", "localhost:8080")
    .argument(
      "[orgId]",
      "Id of the organization that data should be read from. If this is not provided, all organizations will be read."
    )
    .hook("preAction", useFirebase)
    .action(backup);

  program
    .command("restore")
    .description("Restore an organizations data from a JSON file.")
    .requiredOption(
      "-p, --project <projectId>",
      "ID of the project credentials used as auth against a firestore instance. Credentials should first be stored with `projects:add`"
    )
    .option("-e, --emulators", "use emulator instance / data", false)
    .option("-h, --host", "specify the emulator host", "localhost:8080")
    .argument(
      "<filePath>",
      "Path to a JSON file of organisation data that will restore/overwrite production data."
    )
    .hook("preAction", useFirebase)
    .hook("preAction", useConfirmRestore)
    .action(restore);

  return program;
}
