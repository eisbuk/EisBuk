import { FirestoreSchema } from "eisbuk-shared";

export interface TaskHandler<A extends any = undefined> {
  (payload: A): null | Promise<null>;
}

type FirestoreCollections = Omit<
  FirestoreSchema["organizations"][keyof FirestoreSchema["organizations"]],
  "admins"
>;
export type FirestoreDataUpdate = Partial<
  Omit<FirestoreCollections, "slotsByDay">
>;
