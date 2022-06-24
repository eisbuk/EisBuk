/**
 * @jest-environment node
 */
import restoreCmd from "../commands/restore";
import backupCmd from "../commands/backup";

import * as restore from "../commands/restore/restore";
import * as backup from "../commands/backup/backup";

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Restore command", () => {
  jest.spyOn(restore, "restoreSingleOrgFromFs").mockImplementation();

  test("restores an org from a json file", async () => {
    const testFilePath = "test-file-path.json";
    await restoreCmd(testFilePath);

    expect(restore.restoreSingleOrgFromFs).toBeCalledWith(testFilePath);
  });
});

describe("Backup command", () => {
  jest.spyOn(backup, "backupAllOrgsToFs").mockImplementation();
  jest.spyOn(backup, "backupSingleOrgToFs").mockImplementation();

  test("backs up all orgs if no orgId is passed", async () => {
    await backupCmd();

    expect(backup.backupAllOrgsToFs).toBeCalled();
  });

  test("backs up all orgs if no orgId is passed", async () => {
    const testOrgId = "test-org-id";

    await backupCmd(testOrgId);

    expect(backup.backupSingleOrgToFs).toBeCalledWith(testOrgId);
  });
});
