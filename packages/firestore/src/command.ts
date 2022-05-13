import { Command } from "commander";

import {
  backupAllOrgsToFs,
  backupSingleOrgToFs,
  restoreSingleOrgFromFs,
} from "./";

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

  program.command("backupAllOrgs").action(backupAllOrgsToFs);

  program
    .command("backup")
    .argument(
      "<orgId>",
      "The name of the organization that data will be read from."
    )
    .action(backupSingleOrgToFs);

  program
    .command("restore")
    .argument(
      "<filePath>",
      "Path to a JSON file of organisation data that will restore/overwrite production data."
    )
    .action(restoreSingleOrgFromFs);

  return program;
}
