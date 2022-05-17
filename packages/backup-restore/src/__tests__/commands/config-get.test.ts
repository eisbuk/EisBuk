/**
 * @jest-environment node
 */

import { makeProgram } from "../../command";
import { defaultConfig, ConfigOptions } from "../../configstore";

afterAll(() => {
  jest.restoreAllMocks();
});

test("config:get returns default config", async () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  const program = makeProgram({ exitOverride: true });

  program.parseAsync([
    "node",
    "eisbuk",
    "config:get",
    "-o",
    ConfigOptions.EmulatorHost,
  ]);
  program.parseAsync([
    "node",
    "eisbuk",
    "config:get",
    "-o",
    ConfigOptions.UseEmulators,
  ]);
  program.parseAsync([
    "node",
    "eisbuk",
    "config:get",
    "-o",
    ConfigOptions.ActiveProject,
  ]);

  expect(consoleSpy).toBeCalledWith(defaultConfig.emulatorHost);
  expect(consoleSpy).toBeCalledWith(defaultConfig.useEmulators);
  expect(consoleSpy).toBeCalledWith(defaultConfig.activeProject);
});
