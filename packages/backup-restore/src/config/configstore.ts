import fs from "fs";
import Configstore from "configstore";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));

export enum ConfigOptions {
  Projects = "projects",
  ActiveProject = "activeProject",
  UseEmulators = "useEmulators",
  EmulatorHost = "emulatorHost",
}

export interface Config {
  projects: string[];
  activeProject: string | null;
  useEmulators: string;
  emulatorHost: string;
}

export const defaultConfig: Config = {
  projects: [],
  activeProject: null,
  useEmulators: "false",
  emulatorHost: "localhost:8080",
};

export const configstore = new Configstore(pkg.name, defaultConfig);
