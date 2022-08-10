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

  // const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  // test("projects:list returns a list of project IDs whose credentials are stored", async () => {
  //   configStoreSpy.mockReturnValue(defaultConfig.projects);

  //   program.parseAsync(["node", "eisbuk", "projects:list"]);

  //   expect(consoleSpy).toBeCalledWith(defaultConfig.projects);
  // });

  // TODO: following two tests could be more extensive (see "commands/projects" src file)
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
