import { TaskHandler } from "./types";

import handleFirestoreUpdate from "./updateFirestore";
import handleGetRecaptchaCode from "./getRecaptchaCode";

interface TaskHandlers {
  [taskName: string]: TaskHandler;
}

const initializeFirebasePlugin = (on: Cypress.PluginEvents): void => {
  on("task", {
    updateFirestore: handleFirestoreUpdate,
    getRecaptchaCode: handleGetRecaptchaCode,
  } as TaskHandlers);
};

export default initializeFirebasePlugin;
