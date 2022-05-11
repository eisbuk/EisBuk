import { program } from "commander";

import { backupToFs, restoreFromFs } from "./";

program.command("backup").action(backupToFs);
program
  .command("restore")
  .argument(
    "fileName",
    "A JSON file of organisation data that will restore/overwrite production data."
  )
  .action(restoreFromFs);

program.parse();
