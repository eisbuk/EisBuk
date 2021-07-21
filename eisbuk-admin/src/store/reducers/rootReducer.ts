import { combineReducers } from "redux";
import { firebaseReducer } from "react-redux-firebase";
import { firestoreReducer } from "redux-firestore";

import appReducer from "./appReducer";
import authReducer from "./authReducer";
import copyPasteReducer from "./copyPasteReducer";

const rootReducer = combineReducers({
  firebase: firebaseReducer,
  firestore: firestoreReducer,
  app: appReducer,
  copyPaste: copyPasteReducer,
  authInfoEisbuk: authReducer,
});

export default rootReducer;
