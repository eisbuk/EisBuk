/**
 * @jest-environment node
 */
import fs from "fs/promises";

import * as restore from "../../commands/restore/restore";
import * as restoreService from "../../firestore/restoreService";

import { FsErrors } from "../../lib/types";

afterAll(() => {
  jest.restoreAllMocks();
});

describe("restoreSingleOrgFromFs:", () => {
  const { restoreSingleOrgFromFs } = restore;

  test("Catches an error if the file doesn't exist", async () => {
    jest.spyOn(fs, "access").mockRejectedValue(false);

    const filePath = "";

    await expect(restoreSingleOrgFromFs(filePath)).rejects.toThrow(
      FsErrors.FILE_NOT_FOUND
    );
  });

  test("Catches an error if the file is not valid json", async () => {
    jest.spyOn(fs, "access").mockResolvedValue();

    const filePath = "test.txt";

    await expect(restoreSingleOrgFromFs(filePath)).rejects.toThrow(
      FsErrors.INVALID_FILE
    );
  });

  test("Catches an error if the restore service fails", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("{}");
    jest.spyOn(fs, "access").mockResolvedValue();

    const mockRestoreServiceError = "Error writing to DB";
    jest
      .spyOn(restoreService, "restoreOrganizations")
      .mockRejectedValue({ ok: false, message: mockRestoreServiceError });

    const filePath = "test.json";

    await expect(restoreSingleOrgFromFs(filePath)).rejects.toThrow(
      mockRestoreServiceError
    );
  });
});
