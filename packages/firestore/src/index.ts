import fs from "fs/promises";
import path from "path";
import "./firebase";

import { IOperationFailure, IOperationSuccess, IOrgData } from "./types";

import * as backupService from "./backup";

export { backupService };

/**
 * backup
 */
export async function backup(): Promise<
  IOperationSuccess<string> | IOperationFailure
> {
  try {
    const orgDataOp = await getAllOrgData();

    if (orgDataOp.ok) {
      const writeDataOps = orgDataOp.data.map(async (orgData) => {
        const fileName = `${orgData.id}.json`;
        const filePath = path.resolve(process.cwd(), fileName);

        const orgDataJson = JSON.stringify(orgData);

        await fs.writeFile(filePath, orgDataJson, "utf-8");
      });

      await Promise.all(writeDataOps);

      return { ok: true, data: "OK" };
    } else {
      throw new Error(orgDataOp.message);
    }
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * getAllOrgData - Retrieve all data for all orgs
 */
export async function getAllOrgData(): Promise<
  IOperationSuccess<IOrgData[]> | IOperationFailure
> {
  try {
    const orgsOp = await backupService.getOrgs();

    if (orgsOp.ok === true) {
      const orgs = orgsOp.data;

      const getFullOrgDataOps = orgs.map(backupService.getOrgData);

      const orgData = await Promise.all(getFullOrgDataOps);

      return { ok: true, data: orgData };
    } else {
      throw new Error(orgsOp.message);
    }
  } catch (err: any) {
    return { ok: false, message: err };
  }
}
