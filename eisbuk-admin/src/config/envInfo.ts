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
function getOrgFromCookie(): string {
  const allCookies = document.cookie;
  const sepCookies = allCookies.split(";")
  // {
  //   "key": "value",

  // }
  let CookieValues = sepCookies.reduce((acc, curr) =>  ({

    ...acc, [curr.slice(1,(curr.length-1)).split("=")[0]] : curr.slice(1,(curr.length-1)).split("=")[1]

  }), {})
  return CookieValues["domain"];
}


if (!__eisbukSite__) {
  isDev =
    window.location.port !== "" &&
    window.location.port !== "80" &&
    window.location.port !== "443";

  const orgCookie = getOrgFromCookie()
  console.log(orgCookie)
  console.log(getOrgFromLocation(window.location.hostname))
  ORGANIZATION = orgCookie || getOrgFromLocation(window.location.hostname);
} else {
  isDev = false;
  ORGANIZATION = __eisbukSite__;
  console.log(
    `Using ${ORGANIZATION} as organization as specified in EISBUK_SITE environment variable`
  );
}

export { isDev, functionsZone, getOrgFromLocation, ORGANIZATION };
