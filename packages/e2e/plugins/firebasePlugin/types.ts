import { FirestoreSchema } from "@eisbuk/shared";

/**
 * A Node environment side handler for tasks dispatched by cypress commands
 * @param {any} payload payload passed as second argumant to `cy.task`
 * @returns a defined value or `null` (or promise which resolves to such value) the values is
 * the yelded to cypress' iterator (void or undefined will cause and error with iterator and is illegal in cypress)
 */
export interface TaskHandler<A extends any = undefined, R = null> {
  (payload: A): R | PromiseLike<R>;
}

type FirestoreCollections = Omit<
  FirestoreSchema["organizations"][keyof FirestoreSchema["organizations"]],
  "admins"
>;
export type FirestoreDataUpdate = Partial<
  Omit<FirestoreCollections, "slotsByDay">
>;
