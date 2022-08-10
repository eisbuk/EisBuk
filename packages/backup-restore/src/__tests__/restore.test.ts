/**
 * @jest-environment node
 */
import restoreCmd from "../commands/restore";

// import * as restore from "firestore-export-import";

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Restore command", () => {
  test("stub", () => expect(true).toBe(true));

  // jest.spyOn(restore, "restore").mockImplementation();

  // test("restores an org from a json file", async () => {
  //   const testFilePath = "test-file-path.json";
  //   await restoreCmd(testFilePath);

  //   expect(restore.restore).toBeCalledWith(testFilePath);
  // });
});
