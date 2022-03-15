// storybook env constants

import { getOrgFromLocation } from "@/utils/helpers";
import { __testOrganization__ } from "@/__testSetup__/envData";

/**
 * A date we're using for both storybook and testing
 * - for storybook it's convenient to have any 'static' date, in order for chromatic checks to not produce false positives
 * - this exact date is convenient for testing as it's both start of week as well as month
 */
export const __storybookDate__ = "2021-03-01";
export const __isStorybook__ = Boolean(process.env.STORYBOOK_IS_STORYBOOK);

// env info variable (production, test, etc)
export const __isDev__ = process.env.NODE_ENV !== "production";
// check for explicit "test" environment
export const __isTest__ = process.env.NODE_ENV === "test";

// organization constants
export const __organization__ = __isTest__
  ? // since we're importing organization string from this constant
    // to make our lives easier (so that we don't have to mock organization)
    // the __organization__ in test environment will always have a value of __testOrganization__
    __testOrganization__
  : process.env.REACT_APP_EISBUK_SITE ||
    (window.location
      ? getOrgFromLocation(window.location.hostname)
      : "localhost");

// variables loaded from .env.deveolpment.local or .env.production.local file with respect to NODE_ENV
export const __projectId__ = process.env.REACT_APP_FIREBASE_PROJECT_ID;
export const __firebaseApiKey__ =
  process.env.NODE_ENV !== "production"
    ? "api-key"
    : process.env.REACT_APP_FIREBASE_API_KEY;
export const __firebaseAppId__ = process.env.REACT_APP_FIREBASE_APP_ID;
export const __databaseURL__ = process.env.REACT_APP_DATABASE_URL;

// production only env variables
export const __authDomain__ = __isDev__
  ? "localhost"
  : process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
export const __storageBucket__ = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
export const __measurementId__ = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;

// common constants, shared across all environments
export const __functionsZone__ = "europe-west6";

// other
export const __sentryDSN__ = process.env.REACT_APP_SENTRY_DSN;
export const __sentryEnvironment__ =
  process.env.REACT_APP_SENTRY_ENVIRONMENT || "development";

export const __sentryRelease__ =
  process.env.REACT_APP_SENTRY_RELEASE || "unspecified";
