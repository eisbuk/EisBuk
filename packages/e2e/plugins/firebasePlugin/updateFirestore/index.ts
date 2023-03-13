import { DocumentData } from "@google-cloud/firestore";

import { TaskHandler } from "../types";
import { adminDb } from "./adminDb";

import {
  updateSlots,
  updateCustomers,
  updateBookings,
  updateAttendance,
  updateOrganization,
} from "./updateFirestoreData";

// Create task handler serves as a wrapper around the update functions
// transforming them into a task handlers for cypress task commands.
const createTaskHandler =
  <D extends Record<string, any>>(
    updateHandler: (
      orgRef: FirebaseFirestore.DocumentReference<DocumentData>,
      documents: D
    ) => Promise<any>
  ): TaskHandler<{ organization: string; documents: D }, null> =>
  async ({ organization, documents }) => {
    const orgRef = adminDb.collection("organizations").doc(organization);
    await updateHandler(orgRef, documents);
    return null;
  };

export const handleUpdateOrganization = createTaskHandler(updateOrganization);

export const handleUpdateSlots = createTaskHandler(updateSlots);

export const handleUpdateCustomers = createTaskHandler(updateCustomers);

export const handleUpdateBookings = createTaskHandler(updateBookings);

export const handleUpdateAttendance = createTaskHandler(updateAttendance);
