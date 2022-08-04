import { combineReducers } from "redux";

import appReducer from "./appReducer";
import authReducer from "./authReducer";
import copyPasteReducer from "./copyPasteReducer";
import { reducer as firestoreReducer } from "@eisbuk/react-redux-firebase-firestore";
import modalReducer from "@/features/modal/reducer";
import notificationsReducer from "@/features/notifications/reducer";

const rootReducer = combineReducers({
  firestore: firestoreReducer,
  app: appReducer,
  copyPaste: copyPasteReducer,
  auth: authReducer,
  modal: modalReducer,
  notifications: notificationsReducer,
});

export default rootReducer;
