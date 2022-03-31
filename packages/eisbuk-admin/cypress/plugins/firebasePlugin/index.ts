import { TaskHandler } from "./types";

import handleFirestoreUpdate from "./updateFirestore";
import handleGetRecaptchaCode from "./getRecaptchaCode";
import handleGetSigninLink from "./getSigninLink";

interface TaskHandlers {
  [taskName: string]: TaskHandler;
}

const initializeFirebasePlugin = (on: Cypress.PluginEvents): void => {
  on("task", {
    updateFirestore: handleFirestoreUpdate,
    getRecaptchaCode: handleGetRecaptchaCode,
    getSigninLink: handleGetSigninLink,
  } as TaskHandlers);
};

export default initializeFirebasePlugin;
