import { FirestoreState, GlobalStateFragment } from "../types";

export const getFirestoreListeners = (
  state: GlobalStateFragment
): FirestoreState["listeners"] => state.firestore.listeners;
