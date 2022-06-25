import { combineReducers } from "redux";

import appReducer from "./appReducer";
import authReducer from "./authReducer";
import copyPasteReducer from "./copyPasteReducer";
import firestoreReducer from "@/react-redux-firebase/reducer";
import modalReducer from "@/features/modal/reducer";
import notificationsReducer from "./notificationsReducer";

const rootReducer = combineReducers({
  firestore: firestoreReducer,
  app: appReducer,
  copyPaste: copyPasteReducer,
  auth: authReducer,
  modal: modalReducer,
  notifications: notificationsReducer,
});

export default rootReducer;
