import { initializeApp, FirebaseOptions } from "@firebase/app";
import {
  useDeviceLanguage,
  getAuth,
  connectAuthEmulator,
} from "@firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore,
  enableIndexedDbPersistence,
} from "@firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "@firebase/functions";

import {
  __isDev__,
  __firebaseApiKey__,
  __firebaseAppId__,
  __databaseURL__,
  __projectId__,
  __authDomain__,
  __storageBucket__,
  __measurementId__,
} from "@/lib/constants";

import { getNewStore } from "./createStore";

const fbConfig: FirebaseOptions = {
  // common config data
  // loaded from .env variables according to environment
  databaseURL: __databaseURL__,
  projectId: __projectId__,
  apiKey: __firebaseApiKey__,
  appId: __firebaseAppId__,
  // additional production-only config data
  ...(!__isDev__ && {
    authDomain: __authDomain__,
    storageBucket: __storageBucket__,
    measurementId: __measurementId__,
  }),
};

// Initialize Firebase, Firestore and Functions instances
const firebase = initializeApp(fbConfig);
initializeFirestore(firebase, {
  experimentalForceLongPolling: __isDev__,
});

const auth = getAuth();
// eslint-disable-next-line react-hooks/rules-of-hooks
useDeviceLanguage(auth);
const db = getFirestore();

const functions = getFunctions(firebase, "europe-west6");
console.log(`Functions region > ${functions.region}`);

if (__isDev__) {
  console.warn(
    "Using local emulated Database (localhost:8080) instead of " +
      fbConfig.databaseURL
  );
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099/");
  connectFunctionsEmulator(functions, "localhost", 5001);
  console.warn("Using emulator for functions and authentication");
  // window.firebase = firebase as any;
} else {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Multiple tabs open, persistence can only be enabled in one tab at a a time."
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "The current browser does not support all of the features required to enable persistence"
      );
    }
  });
}

export const store = getNewStore();
