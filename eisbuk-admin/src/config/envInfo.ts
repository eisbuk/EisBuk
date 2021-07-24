import { __eisbukSite__ } from "@/lib/constants";
// Provide information about the environment we're running in

let isDev: boolean;
let functionsZone: string | undefined;
let ORGANIZATION: string;

if (!__eisbukSite__) {
  isDev =
    window.location.port !== "" &&
    window.location.port !== "80" &&
    window.location.port !== "443";

  functionsZone = isDev ? undefined : "europe-west6";

  ORGANIZATION = window.location.hostname;
} else {
  isDev = false;
  functionsZone = "europe-west6";
  ORGANIZATION = __eisbukSite__;
  console.log(
    `Using ${ORGANIZATION} as organization as specified in EISBUK_SITE environment variable`
  );
}

export { isDev, functionsZone, ORGANIZATION };
