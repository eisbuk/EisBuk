import { restoreSingleOrgFromFs, useConfirmRestore } from "./restore";

/**
 * Restore command
 */
export default async function restore(filePath: string): Promise<void> {
  try {
    await restoreSingleOrgFromFs(filePath);
  } catch (err: any) {
    console.error(err);
  }
}

export { useConfirmRestore };
