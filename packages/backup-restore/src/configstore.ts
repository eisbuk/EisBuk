import fs from "fs";
import Configstore from "configstore";

import { Config } from "./types";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const defaultConfig: Config = {
  projects: [],
  activeProject: null,
  useEmulators: false,
  emulatorHost: "localhost:8081",
};

export const configstore = new Configstore(pkg.name, defaultConfig);
