/**
 * @jest-environment node
 */
import fs from "fs/promises";

import { exists } from "../lib/helpers";

import { FsErrors } from "../lib/types";

test("Throws an error if the file doesn't exist", async () => {
  jest.spyOn(fs, "access").mockRejectedValue(new Error());

  const filePath = "";

  await expect(exists(filePath)).rejects.toThrow(FsErrors.FILE_NOT_FOUND);
});

test("Throws an error if the file is not valid json", async () => {
  jest.spyOn(fs, "access").mockResolvedValue();

  const filePath = "test.txt";

  await expect(exists(filePath)).rejects.toThrow(FsErrors.INVALID_FILE);
});
