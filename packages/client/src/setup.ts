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
  __firestoreEmulatorHost__,
  __firestoreEmulatorPort__,
  __authEmulatorURL__,
  __functionsEmulatorHost__,
  __functionsEmulatorPort__,
} from "@/lib/constants";

console.log("using db url:", __databaseURL__);

const fbConfig: FirebaseOptions = {
  // common config data
  // loaded from .env variables according to environment
  databaseURL: __databaseURL__,
  projectId: __projectId__,
  apiKey: __firebaseApiKey__,
  appId: __firebaseAppId__,
  authDomain: __authDomain__,
  // additional production-only config data
  ...(!__isDev__ && {
    storageBucket: __storageBucket__,
    measurementId: __measurementId__,
  }),
};

// Initialize Firebase, Firestore and Functions instances
export const app = initializeApp(fbConfig);
initializeFirestore(app, {
  experimentalForceLongPolling: __isDev__,
});

export const auth = getAuth();
// eslint-disable-next-line react-hooks/rules-of-hooks
useDeviceLanguage(auth);
export const db = getFirestore();

export const functions = getFunctions(app, "europe-west6");
console.log(`Functions region > ${functions.region}`);

if (__isDev__) {
  console.warn(
    `Using local emulated Database (${__firestoreEmulatorHost__}:${__firestoreEmulatorPort__}) instead of ` +
      fbConfig.databaseURL
  );
  console.log("firestore host:", __firestoreEmulatorHost__);
  console.log("firestore port:", __firestoreEmulatorPort__);
  connectFirestoreEmulator(
    db,
    __firestoreEmulatorHost__,
    __firestoreEmulatorPort__
  );
  console.log("auth url:", __authEmulatorURL__);
  connectAuthEmulator(auth, __authEmulatorURL__);
  console.log("functions host:", __functionsEmulatorHost__);
  console.log("functions port:", __functionsEmulatorPort__);
  connectFunctionsEmulator(
    functions,
    __functionsEmulatorHost__,
    __functionsEmulatorPort__
  );
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
