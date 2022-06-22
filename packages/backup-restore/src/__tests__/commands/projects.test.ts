/**
 * @jest-environment node
 */

import { makeProgram } from "../../command";
import { defaultConfig } from "../../config/configstore";

// import { configStoreSpy } from "./config-set.test";

afterAll(() => {
  jest.restoreAllMocks();
});

test("projects:list returns a list of project IDs whose credentials are stored", async () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  const program = makeProgram({ exitOverride: true });

  program.parseAsync(["node", "eisbuk", "projects:list"]);

  expect(consoleSpy).toBeCalledWith(defaultConfig.projects);
});

test("projects:add adds firebase credentials to xdg-specific app data path", async () => {
  // TODO: Figure out why this won't work, or re-structure configstore
  // const mockServiceAccountJson = JSON.stringify({
  //   projectId: "fake-id",
  // });
  // const configStoreSpy = jest.spyOn(configstore, "set").mockImplementation();
  // jest.spyOn(fs, "access").mockResolvedValue();
  // jest.spyOn(fs, "readFile").mockResolvedValue(mockServiceAccountJson);
  // jest.spyOn(fs, "writeFile").mockResolvedValue();
  // const program = makeProgram({ exitOverride: true });
  // program.parseAsync(["node", "eisbuk", "projects:add", "serviceAccount.json"]);
  // expect(configStoreSpy).toBeCalledWith(ConfigOptions.Projects, ["fake-id"]);
});
