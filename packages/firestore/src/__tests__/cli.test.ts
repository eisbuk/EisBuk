/**
 * @jest-environment node
 */
import admin from "firebase-admin";

import { adminDb } from "../__testSetup__/adminDb";

import { makeProgram } from "../command";
import * as services from "../index";

jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

afterAll(() => {
  jest.restoreAllMocks();
});

test("backupAllOrgs command", async () => {
  const commandSpy = jest
    .spyOn(services, "backupAllOrgsToFs")
    .mockImplementation();

  const program = makeProgram({ exitOverride: true });

  program.parseAsync(["node", "eisbuk", "backupAllOrgs"]);

  expect(commandSpy).toHaveBeenCalled();
});

test("backup command", async () => {
  const commandSpy = jest
    .spyOn(services, "backupSingleOrgToFs")
    .mockImplementation();

  const program = makeProgram({ exitOverride: true });

  const orgId = "testOrg";

  program.parseAsync(["node", "eisbuk", "backup", orgId]);

  const [firstCall] = commandSpy.mock.calls;
  const [resultPath] = firstCall;

  expect(commandSpy).toHaveBeenCalled();
  expect(resultPath).toBe(orgId);
});

test("restore command", async () => {
  const commandSpy = jest
    .spyOn(services, "restoreSingleOrgFromFs")
    .mockImplementation();

  const program = makeProgram({ exitOverride: true });

  const filePath = "test.json";

  program.parseAsync(["node", "eisbuk", "restore", filePath]);

  const [firstCall] = commandSpy.mock.calls;
  const [resultPath] = firstCall;

  expect(commandSpy).toHaveBeenCalled();
  expect(resultPath).toBe(filePath);
});
