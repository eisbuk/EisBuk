// storybook env constants

import { getOrgFromLocation } from "@/utils/helpers";
import { __testOrganization__ } from "@eisbuk/testing/envData";

// sometimes we want to change the behaviour of our app regardless of NODE_ENV (which can't be set explicitly with our current config)
// therefore we're using the `__buildEnv__`, which we can control through `process.env.BUILD_ENV`, if undefined, will fall back to `process.env.NODE_ENV`
export const __buildEnv__ = process.env.BUILD_ENV || process.env.NODE_ENV;

/**
 * A date we're using for both storybook and testing
 * - for storybook it's convenient to have any 'static' date, in order for chromatic checks to not produce false positives
 * - this exact date is convenient for testing as it's both start of week as well as month
 */
export const __storybookDate__ = "2021-03-01";
export const __isStorybook__ = Boolean(process.env.STORYBOOK_IS_STORYBOOK);

// env info variable (production, test, etc)
export const __isDev__ = __buildEnv__ !== "production";
// check for explicit "development" environment (excluding test, which, in looser definition, is also a development environment)
export const __isDevStrict__ = __buildEnv__ === "development";
// check for explicit "test" environment
export const __isTest__ = __buildEnv__ === "test";

// organization constants
export const __organization__ = __isTest__
  ? // since we're importing organization string from this constant
    // to make our lives easier (so that we don't have to mock organization)
    // the getOrganization() in test environment will always have a value of __testOrganization__
    __testOrganization__
  : process.env.REACT_APP_EISBUK_SITE ||
    (window.location
      ? getOrgFromLocation(window.location.hostname)
      : "localhost");

// variables loaded from .env.deveolpment.local or .env.production.local file with respect to BUILD_ENV
export const __projectId__ = process.env.REACT_APP_FIREBASE_PROJECT_ID;
export const __firebaseApiKey__ =
  __buildEnv__ !== "production"
    ? "api-key"
    : process.env.REACT_APP_FIREBASE_API_KEY;
export const __firebaseAppId__ = process.env.REACT_APP_FIREBASE_APP_ID;
export const __databaseURL__ = process.env.REACT_APP_DATABASE_URL;

// emulators setup
export const __firestoreEmulatorHost__ =
  process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
export const __firestoreEmulatorPort__ =
  Number(process.env.REACT_APP_FIRESTORE_EMULATOR_PORT) || 8080;
export const __authEmulatorHost__ =
  process.env.REACT_APP_AUTH_EMULATOR_HOST || "127.0.0.1";
export const __authEmulatorPort__ =
  Number(process.env.REACT_APP_AUTH_EMULATOR_PORT) || 9099;
export const __authEmulatorURL__ = `http://${__authEmulatorHost__}:${__authEmulatorPort__}/`;
export const __functionsEmulatorHost__ =
  process.env.REACT_APP_FUNCTIONS_EMULATOR_HOST || "127.0.0.1";
export const __functionsEmulatorPort__ =
  Number(process.env.REACT_APP_FUNCTIONS_EMULATOR_PORT) || 5001;

// production only env variables
export const __authDomain__ = __isDev__
  ? __authEmulatorHost__
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
