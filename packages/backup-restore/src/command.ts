import { Command } from "commander";

import backup from "./commands/backup";
import restore from "./commands/restore";
import { getConfigOption, listOptions } from "./commands/config-get";
import { setConfigOption } from "./commands/config-set";
import {
  listProjectCredentials,
  addProjectCredentials,
  removeProjectCredentials,
} from "./commands/projects";
import { useFirebase } from "./hooks/before";

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
    .command("config:get")
    .description(
      `
    Get config options using -o | --option <name>
    Options include: ${listOptions()}
    `
    )
    .option("-o, --option <name>", "Config option name")
    .action(getConfigOption);

  program
    .command("config:set")
    .description(
      `
    Set config options using -o | --option <name> <value>
    Options include: ${listOptions()}
    `
    )
    .option("-o, --option <name> ", "Config option name")
    .argument("<value>", "New option value")
    .action(setConfigOption);

  program
    .command("projects:list")
    .description("List project IDs of available firebase credentials")
    .action(listProjectCredentials);

  program
    .command("projects:add")
    .argument("<filePath>", "Path to firebase service account JSON file")
    .action(addProjectCredentials);

  program
    .command("projects:remove")
    .argument("<projectId>", "Firebase service account ID")
    .action(removeProjectCredentials);

  program
    .command("backup")
    .description(
      "Backup organization(s) to JSON in the current working directory."
    )
    .argument(
      "[orgId]",
      "Id of the organization that data should be read from. If this is not provided, all organizations will be read."
    )
    .hook("preAction", useFirebase)
    .action(backup);

  program
    .command("restore")
    .description("Restore an organizations data from a JSON file.")
    .argument(
      "<filePath>",
      "Path to a JSON file of organisation data that will restore/overwrite production data."
    )
    .hook("preAction", useFirebase)
    .action(restore);

  return program;
}
