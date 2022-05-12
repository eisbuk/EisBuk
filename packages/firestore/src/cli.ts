import { program } from "commander";

import {
  backupAllOrgsToFs,
  backupSingleOrgToFs,
  restoreSingleOrgFromFs,
} from "./";

program.command("backupAllOrgs").action(backupAllOrgsToFs);

program
  .command("backup")
  .argument(
    "orgId",
    "The name of the organization that data will be read from."
  )
  .action(backupSingleOrgToFs);

program
  .command("restore")
  .argument(
    "filePath",
    "Path to a JSON file of organisation data that will restore/overwrite production data."
  )
  .action(restoreSingleOrgFromFs);

program.parse();
