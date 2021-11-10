import { __eisbukSite__ } from "@/lib/constants";
// Provide information about the environment we're running in

const functionsZone = "europe-west6";
let isDev: boolean;
let ORGANIZATION: string;

/**
 * @param  {string} location (for instance website.web.app)
 * @returns string

Firebase hosting has a concept of "preview channels":
https://firebase.google.com/docs/hosting/test-preview-deploy
When deployed this way, apps will be served on a URL derived from the main
hosting URL. For instance, for appname.web.app, a preview channel named new-feature
can be published at https://appname--new-feature-randomhash.web.app/
*/
function getOrgFromLocation(location: string): string {
  return location.replace(/--[^.]+/, "");
}

export const getOrganization = () => {
  if (!__eisbukSite__) {
    const localStorageOrganization = localStorage.getItem("organization");
    ORGANIZATION =
      localStorageOrganization || getOrgFromLocation(window.location.hostname);
  } else {
    ORGANIZATION = __eisbukSite__;
    console.log(
      `Using ${ORGANIZATION} as organization as specified in EISBUK_SITE environment variable`
    );
  }
  return ORGANIZATION;
};

if (!__eisbukSite__) {
  isDev =
    window.location.port !== "" &&
    window.location.port !== "80" &&
    window.location.port !== "443";
} else {
  isDev = false;
}

export { isDev, functionsZone, getOrgFromLocation };
