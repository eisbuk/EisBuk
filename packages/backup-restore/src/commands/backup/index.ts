import { backupAllOrgsToFs, backupSingleOrgToFs } from "./backup";

/**
 * Backup command
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
