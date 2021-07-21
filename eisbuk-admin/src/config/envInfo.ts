import { EISBUK_SITE } from "./envInfoEnv";
// Provide information about the environment we're running in

let isDev: boolean;
let functionsZone: string | undefined;
let ORGANIZATION: string;

if (!EISBUK_SITE) {
  isDev =
    window.location.port !== "" &&
    window.location.port !== "80" &&
    window.location.port !== "443";

  functionsZone = isDev ? undefined : "europe-west6";

  ORGANIZATION = window.location.hostname;
} else {
  isDev = false;
  functionsZone = "europe-west6";
  ORGANIZATION = EISBUK_SITE;
  console.log(
    `Using ${ORGANIZATION} as organization as specified in EISBUK_SITE environment variable`
  );
}

export { isDev, functionsZone, ORGANIZATION };
