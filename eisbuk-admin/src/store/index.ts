import { initializeApp } from "@firebase/app";
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
  __messagingSenderId__,
  __authDomain__,
  __storageBucket__,
  __measurementId__,
} from "@/lib/constants";

const fbConfig = {
  // common config data
  // loaded from .env variables according to environment
  databaseURL: __databaseURL__,
  projectId: __projectId__,
  apiKey: __firebaseApiKey__,
  messagingSenderId: __messagingSenderId__,
  appId: __firebaseAppId__,
  // additional production-only config data
  ...(!__isDev__ && {
    authDomain: __authDomain__,
    storageBucket: __storageBucket__,
    measurementId: __measurementId__,
  }),
};

if (__isDev__) {
  console.warn("Using local emulated Database : " + fbConfig.databaseURL);
}

// Initialize Firebase, Firestore and Functions instances
const firebase = initializeApp(fbConfig);
initializeFirestore(firebase, {});

const auth = getAuth();
// eslint-disable-next-line react-hooks/rules-of-hooks
useDeviceLanguage(auth);
const db = getFirestore();

const functions = getFunctions();

if (__isDev__) {
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

export * from "./store";
