import { TaskHandler } from "./types";

import {
  handleUpdateSlots,
  handleUpdateCustomers,
  handleUpdateBookings,
  handleUpdateAttendance,
  handleUpdateOrganization,
} from "./updateFirestore";
import handleGetRecaptchaCode from "./getRecaptchaCode";
import handleGetSigninLink from "./getSigninLink";

interface TaskHandlers {
  [taskName: string]: TaskHandler<any, any>;
}

const initializeFirebasePlugin = (on: Cypress.PluginEvents): void => {
  on("task", {
    updateOrganization: handleUpdateOrganization,
    updateSlots: handleUpdateSlots,
    updateCustomers: handleUpdateCustomers,
    updateBookings: handleUpdateBookings,
    updateAttendance: handleUpdateAttendance,

    getRecaptchaCode: handleGetRecaptchaCode,
    getSigninLink: handleGetSigninLink,
  } as TaskHandlers);
};

export default initializeFirebasePlugin;
