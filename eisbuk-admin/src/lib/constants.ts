// storybook env constants
export const __storybookDate__ = process.env.STORYBOOK_DATE || "2021-03-01";
export const __isStorybook__ = Boolean(process.env.STORYBOOK_IS_STORYBOOK);

// env info variable
export const __isDev__ = process.env.NODE_ENV === "development";

// dev organization constants
export const __eisbukSite__ = process.env.REACT_APP_EISBUK_SITE;

// variables loaded from .env.deveolpment.local or .env.production.local file with respect to NODE_ENV
export const __firebaseApiKey__ =
  process.env.NODE_ENV === "test"
    ? "test"
    : process.env.REACT_APP_FIREBASE_API_KEY;
export const __firebaseAppId__ = process.env.REACT_APP_FIREBASE_APP_ID;
export const __databaseURL__ = process.env.REACT_APP_DATABASE_URL;
export const __messagingSenderId__ =
  process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID;

// production only env variables
export const __authDomain__ = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
export const __storageBucket__ = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
export const __measurementId__ = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;

// common constants, shared across all environments
export const __projectId__ = "eisbuk";
