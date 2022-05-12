import { program } from "commander";

import { backupAllOrgsToFs, restoreSingleOrgFromFs } from "./";

program.command("backupAllOrgs").action(backupAllOrgsToFs);
program
  .command("restore")
  .argument(
    "filePath",
    "Path to a JSON file of organisation data that will restore/overwrite production data."
  )
  .action(restoreSingleOrgFromFs);

program.parse();
