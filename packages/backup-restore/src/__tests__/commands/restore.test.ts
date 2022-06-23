/**
 * @jest-environment node
 */
import admin from "firebase-admin";

import { adminDb } from "../../__testSetup__/adminDb";

import { makeProgram } from "../../command";
import * as restore from "../../commands/restore";

jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

afterAll(() => {
  jest.restoreAllMocks();
});

test("restore command", async () => {
  const commandSpy = jest
    .spyOn(restore, "restoreSingleOrgFromFs")
    .mockImplementation();

  const program = makeProgram({ exitOverride: true });

  const filePath = "test.json";

  program.parseAsync(["node", "eisbuk", "restore", filePath]);

  const [firstCall] = commandSpy.mock.calls;
  const [resultPath] = firstCall;

  expect(commandSpy).toHaveBeenCalled();
  expect(resultPath).toBe(filePath);
});
