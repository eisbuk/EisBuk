import { program } from "commander";

import { backupToFs } from "./";

program.command("backup").action(backupToFs);

program.parse();
