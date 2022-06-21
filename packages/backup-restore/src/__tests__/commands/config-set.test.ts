/**
 * @jest-environment node
 */

import { makeProgram } from "../../command";
import { ConfigOptions, configstore } from "../../config/configstore";

afterAll(() => {
  jest.restoreAllMocks();
});

test("config:set sets new config values", async () => {
  const configStoreSpy = jest.spyOn(configstore, "set").mockImplementation();
  const program = makeProgram({ exitOverride: true });

  const newEmulatorHost = "localhost:8080";

  program.parseAsync([
    "node",
    "eisbuk",
    "config:set",
    "-o",
    ConfigOptions.EmulatorHost,
    newEmulatorHost,
  ]);

  expect(configStoreSpy).toBeCalledWith(
    ConfigOptions.EmulatorHost,
    newEmulatorHost
  );
});
