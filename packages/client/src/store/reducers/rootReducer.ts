import { combineReducers } from "redux";

import appReducer from "./appReducer";
import authReducer from "./authReducer";
import copyPasteReducer from "./copyPasteReducer";
import firestoreReducer from "@/react-redux-firebase/reducer";
import { reducer as modalReducer } from "@/features/modal";

const rootReducer = combineReducers({
  firestore: firestoreReducer,
  app: appReducer,
  copyPaste: copyPasteReducer,
  auth: authReducer,
  modal: modalReducer,
});

export default rootReducer;
