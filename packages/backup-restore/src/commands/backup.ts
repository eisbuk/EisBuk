import fs from "fs/promises";
import path from "path";

import { backup } from "firestore-export-import";

/**
 * Backup command
 */
export default async function (): Promise<void> {
  try {
    // TODO: Pass options.refs or use backupDocRef to only backup certain orgs if passsed
    const data = await backup("organizations");

    const fileName = `eisbuk.json`;
    const filePath = path.resolve(process.cwd(), fileName);

    const orgDataJson = JSON.stringify(data);

    // TODO: write a file for each
    // { organizations: { x: ..., y: ...}}
    await fs.writeFile(filePath, orgDataJson, "utf-8");
  } catch (err: any) {
    console.error(err);
  }
}
