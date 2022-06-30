import Configstore from "configstore";

const PACKAGE_NAME = "@eisbuk/backup-restore";

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

export const configstore = new Configstore(PACKAGE_NAME, defaultConfig);
