/**
 * @jest-environment node
 */
import backupCmd from "../../commands/backup";

import * as backup from "firestore-export-import";

afterAll(() => {
  jest.restoreAllMocks();
});

// TODO: Add test to check it is passed org names
describe("Backup command", () => {
  jest.spyOn(backup, "backup").mockImplementation();

  test("backs up all orgs if no orgId is passed", async () => {
    await backupCmd();

    expect(backup.backup).toBeCalled();
  });
});
