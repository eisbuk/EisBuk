import { OptionValues } from "commander";

import { configstore, ConfigOptions } from "../config/configstore";

/**
 * Get config option
 */
export function getConfigOption(options: OptionValues): void {
  const configOption = options.option;

  let option;

  switch (configOption) {
    case ConfigOptions.ActiveProject:
      option = getActiveProject();
      break;
    case ConfigOptions.EmulatorHost:
      option = getEmulatorHost();
      break;
    case ConfigOptions.UseEmulators:
      option = getUseEmulator();
      break;
    default:
      console.log(
        `Config option not recognised. Options include:${listOptions()}`
      );
      return;
  }

  console.log(option);
}

/**
 * List Options
 */
export function listOptions(): string {
  const options = Object.values(ConfigOptions);

  return options
    .filter((opt) => opt !== ConfigOptions.Projects)
    .map((opt) => ` '${opt}'`)
    .toString();
}

/**
 * Get emulator host
 */
function getEmulatorHost(): string {
  return configstore.get(ConfigOptions.EmulatorHost);
}

/**
 * Get use emulator
 */
function getUseEmulator(): boolean {
  return configstore.get(ConfigOptions.UseEmulators);
}

/**
 * Get active project
 */
function getActiveProject(): string {
  return configstore.get(ConfigOptions.ActiveProject);
}
