/* eslint-disable import/no-duplicates */
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";

import firebase from "firebase";
import { createStore, applyMiddleware } from "redux";
import { getFirebase } from "react-redux-firebase";
import { createFirestoreInstance } from "redux-firestore";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";

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
firebase.initializeApp(fbConfig);
firebase.auth().useDeviceLanguage();
const db = firebase.firestore();

const functions = firebase.functions();

if (__isDev__) {
  db.useEmulator("localhost", 8080);
  firebase.auth().useEmulator("http://localhost:9099/");
  functions.useEmulator("localhost", 5001);
  console.warn("Using emulator for functions and authentication");
  window.firebase = firebase as any;
} else {
  db.enablePersistence().catch((err) => {
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

export const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch,
  createFirestoreInstance,
};

// Export Redux Store and react-redux-firebase props
export default {
  store,
  rrfProps,
};
