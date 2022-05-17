import { Command } from "commander";

import {
  backupAllOrgsToFs,
  backupSingleOrgToFs,
  restoreSingleOrgFromFs,
} from "./";

import { getConfigOption, listOptions } from "./commands/config-get";
import { setConfigOption } from "./commands/config-set";

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
    .command("backupAllOrgs")
    .description(
      "Backup all organization data to JSON files in the current working directory."
    )
    .action(backupAllOrgsToFs);

  program
    .command("backup")
    .description(
      "Backup a single organization to a JSON file in the current working directory."
    )
    .argument(
      "<orgId>",
      "The name of the organization that data will be read from."
    )
    .action(backupSingleOrgToFs);

  program
    .command("restore")
    .description("Restore an organizations data from a JSON file.")
    .argument(
      "<filePath>",
      "Path to a JSON file of organisation data that will restore/overwrite production data."
    )
    .action(restoreSingleOrgFromFs);

  return program;
}
