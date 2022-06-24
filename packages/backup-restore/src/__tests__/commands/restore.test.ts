/**
 * @jest-environment node
 */
import restoreCmd from "../../commands/restore";

import * as restore from "../../commands/restore/restore";

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
