import { OptionValues } from "commander";

import { configstore } from "../configstore";
import { ConfigOptions } from "../types";

/**
 * Get config option
 */
export function getConfigOption(options: OptionValues): void {
  const configOption = options.option;

  switch (configOption) {
    case ConfigOptions.ActiveProject:
      getActiveProject();
      break;
    case ConfigOptions.EmulatorHost:
      getEmulatorHost();
      break;
    case ConfigOptions.UseEmulator:
      getUseEmulator;
      break;
    default:
      console.log(
        `Config option not recognised. Options include: ${listOptions()}`
      );
  }
}

/**
 * List Options
 */
export function listOptions(): string {
  const options = Object.values(ConfigOptions);

  return options
    .filter((opt) => opt !== ConfigOptions.Projects)
    .map((opt, ix) => `${opt} ${ix !== options.length - 1 ? "-" : ""}`)
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
  return configstore.get(ConfigOptions.UseEmulator);
}

/**
 * Get active project
 */
function getActiveProject(): string {
  return configstore.get(ConfigOptions.ActiveProject);
}
