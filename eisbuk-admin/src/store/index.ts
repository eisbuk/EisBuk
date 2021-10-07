/* eslint-disable import/no-duplicates */
import { createStore, applyMiddleware } from "redux";
import {
  getFirebase,
  ReactReduxFirebaseProviderProps,
} from "react-redux-firebase";
import { createFirestoreInstance } from "redux-firestore";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";

import { initializeApp, getApp } from "firebase/app";
import { useDeviceLanguage, getAuth, connectAuthEmulator } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

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

import rootReducer from "./reducers/rootReducer";

const auth = getAuth();

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

// react-redux-firebase Configuration
const rrfConfig = {
  // userProfile: 'users'
  useFirestoreForProfile: true, // Firestore for Profile instead of Realtime DB
  // enableClaims: true // Get custom claims along with the profile
};

// Initialize Firebase, Firestore and Functions instances
initializeApp(fbConfig);
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

// Create Redux Store with Reducers and Initial state
const middlewares = [thunk.withExtraArgument({ getFirebase })];
export const store = createStore(
  rootReducer,
  {},
  composeWithDevTools(applyMiddleware(...middlewares))
);

export const rrfProps: ReactReduxFirebaseProviderProps = {
  firebase: getApp(),
  config: rrfConfig,
  dispatch: store.dispatch,
  createFirestoreInstance,
};

// Export Redux Store and react-redux-firebase props
export default {
  store,
  rrfProps,
};
