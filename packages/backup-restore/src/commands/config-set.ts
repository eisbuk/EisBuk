import { OptionValues } from "commander";

import { configstore, ConfigOptions } from "../configstore";

import { listOptions } from "./config-get";

/**
 * Get config option
 */
export function setConfigOption(
  arg: string | boolean,
  options: OptionValues
): void {
  const configOption = options.option;

  switch (configOption) {
    case ConfigOptions.ActiveProject:
      setActiveProject(arg as string);
      break;
    case ConfigOptions.EmulatorHost:
      setEmulatorHost(arg as string);
      break;
    case ConfigOptions.UseEmulators:
      setUseEmulators(arg as boolean);
      break;
    default:
      console.log(
        `Config option not recognised. Options include:${listOptions()}`
      );
      return;
  }
}

/**
 * Set active projet
 */
function setActiveProject(value: string | null): void {
  // TODO: validate against project list
  return configstore.set(ConfigOptions.ActiveProject, value);
}

/**
 * Set emulator host
 */
function setEmulatorHost(value: string): void {
  return configstore.set(ConfigOptions.EmulatorHost, value);
}

/**
 * Set use emulators
 */
function setUseEmulators(value: boolean): void {
  // TODO: parse to Boolean and throw if invalid
  return configstore.set(ConfigOptions.UseEmulators, value);
}
