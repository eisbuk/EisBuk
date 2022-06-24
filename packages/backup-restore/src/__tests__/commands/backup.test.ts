/**
 * @jest-environment node
 */
import backupCmd from "../../commands/backup";

import * as backup from "../../commands/backup/backup";

afterAll(() => {
  jest.restoreAllMocks();
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
