import fs from "fs/promises";
import path from "path";

import "./firebase";

import { IOperationFailure, IOperationSuccess, IOrgData } from "./types";

import * as backupService from "./backup";
import * as restoreService from "./restore";
import { exists } from "./helpers";

/**
 * backupSingleOrgToFs - Write a single organization to a JSON file
 * @param {string} orgId - An organization id
 */
export async function backupSingleOrgToFs(orgId: string): Promise<void> {
  try {
    const orgDataOp = await backupSingleOrganization(orgId);

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
    console.error(err.message);
  }
}

/**
 * backupSingleOrganization - Returns root document and subcollection data for a single organization
 * @param {string} orgId - An organization id
 * @returns An organizations: { id: string, data: DocumentData, subcollections: SubcollectionData }
 */
export async function backupSingleOrganization(
  orgId: string
): Promise<IOperationSuccess<IOrgData> | IOperationFailure> {
  try {
    const orgsOp = await backupService.getOrg(orgId);

    if (orgsOp.ok === true) {
      const org = orgsOp.data;

      const subCollectionData = await backupService.getAllSubCollections(
        org.id
      );

      const data = { subCollections: subCollectionData, ...org };

      return { ok: true, data };
    } else {
      throw new Error(orgsOp.message);
    }
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * backupAllOrgsToFs - Write all organization data to JSON files
 */
export async function backupAllOrgsToFs(): Promise<void> {
  try {
    const orgDataOp = await backupAllOrganizations();

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
    console.error(err.message);
  }
}

/**
 * backupAllOrganizations - Returns root document and subcollection data for all organizations
 * @returns An array of Organizations: { id: string, data: DocumentData, subcollections: SubcollectionData }
 */
export async function backupAllOrganizations(): Promise<
  IOperationSuccess<IOrgData[]> | IOperationFailure
> {
  try {
    const orgsOp = await backupService.getOrgs();

    if (orgsOp.ok === true) {
      const orgs = orgsOp.data;

      const getFullOrgDataOps = orgs.map(async (org) => {
        const subCollectionData = await backupService.getAllSubCollections(
          org.id
        );
        return { subCollections: subCollectionData, ...org };
      });

      const orgData = await Promise.all(getFullOrgDataOps);

      return { ok: true, data: orgData };
    } else {
      throw new Error(orgsOp.message);
    }
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

/**
 * restoreSingleOrgFromFs - Read an organisations data from JSON & write it back to the db
 * @param {string} fileName - The name of the JSON file to read from
 */
export async function restoreSingleOrgFromFs(fileName: string): Promise<void> {
  const currentDir = process.cwd();
  const filePath = path.resolve(currentDir, fileName);

  try {
    const fileExists = await exists(filePath);

    // TODO: Validate that its a .json file

    if (!fileExists) {
      throw new Error(`File ${fileName} not found in specified location.`);
    }

    const data = await fs.readFile(filePath, "utf-8");
    const dataObj = JSON.parse(data);

    // TODO: Validate org data before writing => it should only have id, data & subcollections keys
    await restoreOrganizations([dataObj]);

    console.log("Organization successfully restored.");
  } catch (err: any) {
    throw new Error(err.message);
  }
}

/**
 * restoreOrganizations - Set all data for an array of organizations
 * @param {IOrgData[]} orgs - An array of organizations to write: { id, data, subCollections }
 */
export async function restoreOrganizations(
  orgs: IOrgData[]
): Promise<IOperationSuccess<string> | IOperationFailure> {
  try {
    const writeOrgOps = orgs.map(async (org) => {
      await restoreService.setOrganization(org);
    });

    await Promise.all(writeOrgOps);

    return { ok: true, data: "OK" };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}
