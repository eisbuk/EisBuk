/**
 * @jest-environment node
 */

import { makeProgram } from "../../command";
import {
  defaultConfig,
  ConfigOptions,
  configstore,
} from "../../config/configstore";

afterAll(() => {
  jest.restoreAllMocks();
});

describe("config:get", () => {
  const configStoreSpy = jest.spyOn(configstore, "get");
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();

  const program = makeProgram({ exitOverride: true });

  test("Returns default activeProject config", () => {
    configStoreSpy.mockReturnValue(defaultConfig.activeProject);

    program.parseAsync([
      "node",
      "eisbuk",
      "config:get",
      "-o",
      ConfigOptions.ActiveProject,
    ]);

    expect(consoleSpy).toBeCalledWith(defaultConfig.activeProject);
  });

  test("Returns default emulatorHost config", () => {
    configStoreSpy.mockReturnValue(defaultConfig.emulatorHost);

    program.parseAsync([
      "node",
      "eisbuk",
      "config:get",
      "-o",
      ConfigOptions.EmulatorHost,
    ]);

    expect(consoleSpy).toBeCalledWith(defaultConfig.emulatorHost);
  });

  test("Returns default activeProject config", () => {
    configStoreSpy.mockReturnValue(defaultConfig.useEmulators);

    program.parseAsync([
      "node",
      "eisbuk",
      "config:get",
      "-o",
      ConfigOptions.UseEmulators,
    ]);

    expect(consoleSpy).toBeCalledWith(defaultConfig.useEmulators);
  });
});
