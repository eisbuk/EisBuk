import { combineReducers } from "redux";

import appReducer from "./appReducer";
import authReducer from "./authReducer";
import copyPasteReducer from "./copyPasteReducer";
import firestoreReducer from "@/store/firestore/reducer";

const rootReducer = combineReducers({
  firestore: firestoreReducer,
  app: appReducer,
  copyPaste: copyPasteReducer,
  auth: authReducer,
});

export default rootReducer;
