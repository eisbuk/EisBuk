#!/usr/bin/env node

import { makeProgram } from "./command";

/**
 * Main
 */
async function main() {
  const program = makeProgram();

  await program.parseAsync(process.argv);
}

main();
