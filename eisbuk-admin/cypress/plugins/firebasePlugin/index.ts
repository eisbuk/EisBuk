import { TaskHandler } from "./types";

import handleFirestoreUpdate from "./updateFirestore";

interface TaskHandlers {
  [taskName: string]: TaskHandler;
}

const initializeFirebasePlugin = (on: Cypress.PluginEvents): void => {
  on("task", {
    updateFirestore: handleFirestoreUpdate,
  } as TaskHandlers);
};

export default initializeFirebasePlugin;
