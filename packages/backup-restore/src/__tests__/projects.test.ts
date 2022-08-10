/**
 * @jest-environment node
 */

import { makeProgram } from "../command";

import * as projectCmds from "../commands/projects";

const addProjectCmdSpy = jest
  .spyOn(projectCmds, "addProjectCredentials")
  .mockImplementation();

const removeProjectCmdSpy = jest
  .spyOn(projectCmds, "removeProjectCredentials")
  .mockImplementation();

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Project commands", () => {
  const program = makeProgram({ exitOverride: true });

  test("projects:add is invoked with a filePath", async () => {
    const testFilePath = "serviceAccount.json";

    program.parseAsync(["node", "eisbuk", "projects:add", testFilePath]);

    const [callOne] = addProjectCmdSpy.mock.calls;
    const [argOne] = callOne;

    expect(argOne).toBe(testFilePath);
  });

  test("projects:add is invoked with a filePath", async () => {
    const testOrgId = "test-org-id";

    program.parseAsync(["node", "eisbuk", "projects:remove", testOrgId]);

    const [callOne] = removeProjectCmdSpy.mock.calls;
    const [argOne] = callOne;

    expect(argOne).toBe(testOrgId);
  });
});
