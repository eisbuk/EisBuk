import fs from "fs/promises";
import path from "path";

import * as backupService from "../firestore/backupService";

/**
 * Get config option
 */
export default async function backup(orgId?: string): Promise<void> {
  try {
    if (orgId) {
      await backupSingleOrgToFs(orgId);
    } else {
      await backupAllOrgsToFs();
    }
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * backupSingleOrgToFs - Write a single organization to a JSON file in the current working directory
 * @param {string} orgId - An organization id
 */
export async function backupSingleOrgToFs(orgId: string): Promise<void> {
  try {
    const orgDataOp = await backupService.backupSingleOrganization(orgId);

    if (orgDataOp.ok) {
      const { data } = orgDataOp;

      const fileName = `${data.id}.json`;
      const filePath = path.resolve(process.cwd(), fileName);

      const orgDataJson = JSON.stringify(data);

      await fs.writeFile(filePath, orgDataJson, "utf-8");
    } else {
      throw new Error(orgDataOp.message);
    }
  } catch (err: any) {
    throw new Error(err.message);
  }
}

/**
 * backupAllOrgsToFs - Write all organization data to JSON files in the current working directory
 */
export async function backupAllOrgsToFs(): Promise<void> {
  try {
    const orgDataOp = await backupService.backupAllOrganizations();

    if (orgDataOp.ok) {
      const writeDataOps = orgDataOp.data.map(async (orgData) => {
        const fileName = `${orgData.id}.json`;
        const filePath = path.resolve(process.cwd(), fileName);

        const orgDataJson = JSON.stringify(orgData);

        await fs.writeFile(filePath, orgDataJson, "utf-8");
      });

      await Promise.all(writeDataOps);
    } else {
      throw new Error(orgDataOp.message);
    }
  } catch (err: any) {
    throw new Error(err.message);
  }
}
