import fs from "fs/promises";
import path from "path";

import { backup, backupFromDoc } from "firestore-export-import";

import { Collection } from "@eisbuk/shared";
/**
 * Backup command
 */
export default async function (orgId?: string): Promise<void> {
  try {
    if (orgId) {
      const org = await backupFromDoc(Collection.Organizations, orgId);

      await writeOrgJson(orgId, org);
    } else {
      const data: any = await backup(Collection.Organizations);

      const orgs = Object.entries(data[Collection.Organizations]);

      const writePromises = orgs.map(async ([orgId, orgData]) => {
        await writeOrgJson(orgId, orgData);
      });

      await Promise.all(writePromises);
    }
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * Write Org JSON helper
 * @param orgId
 * @param orgData
 */
async function writeOrgJson(orgId: string, orgData: any) {
  const fileName = `${orgId}.json`;
  const filePath = path.resolve(fileName);

  const orgJson = JSON.stringify(orgData);

  await fs.writeFile(filePath, orgJson, "utf-8");
}
