/**
 * @jest-environment node
 */

import { makeProgram } from "../../command";
import { defaultConfig } from "../../config/configstore";

afterAll(() => {
  jest.restoreAllMocks();
});

test("projects:list returns a list of project IDs whose credentials are stored", async () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  const program = makeProgram({ exitOverride: true });

  program.parseAsync(["node", "eisbuk", "projects:list"]);

  expect(consoleSpy).toBeCalledWith(defaultConfig.projects);
});
