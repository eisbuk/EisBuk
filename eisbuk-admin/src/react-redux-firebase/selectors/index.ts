import { LocalStore } from "@/types/store";

export const getFirestoreListeners = (
  state: LocalStore
): LocalStore["firestore"]["listeners"] => state.firestore.listeners;
