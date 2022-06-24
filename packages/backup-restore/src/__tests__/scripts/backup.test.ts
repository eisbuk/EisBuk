/**
 * @jest-environment node
 */
import fs from "fs/promises";

import * as backup from "../../commands/backup/backup";
import * as backupService from "../../firestore/backupService";

const testOrgId = "test-org-id";

afterAll(() => {
  jest.restoreAllMocks();
});

describe("backupSingleOrgToFs:", () => {
  const { backupSingleOrgToFs } = backup;

  test("Catches an error if the restore service fails", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("{}");

    const mockRestoreServiceError = "Error reading from DB";
    jest
      .spyOn(backupService, "backupSingleOrganization")
      .mockRejectedValue({ ok: false, message: mockRestoreServiceError });

    await expect(backupSingleOrgToFs(testOrgId)).rejects.toThrow(
      mockRestoreServiceError
    );
  });
});
