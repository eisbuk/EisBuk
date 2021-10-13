import { createContext } from "react";

import { OrgSubCollection } from "eisbuk-shared";

/**
 * `ReduxFirestoreContext` interface
 */
interface Context {
  /**
   * Handler function used by the `useFirestoreSubscribe` hook
   * to register for a firestore listener.
   * @param collection a name of firestore collection to subscribe to
   * @param consumerId an uuid of given hook instance (used to track outstanding subscriptions)
   */
  setListener: (collection: OrgSubCollection, consumerId: string) => void;
  /**
   * Handler function used by the `useFirestoreSubscribe` hook
   * to unregister a hook from a firestore listener.
   * @param collection a name of firestore collection subscription to cancel
   * @param consumerId an uuid of given hook instance (used to remove the hook from subscribed consumers)
   */
  unsetListener: (collection: OrgSubCollection, consumerId: string) => void;
}

/**
 * A context we use to pass down `setListener` and `unsetListener` handlers
 * from ReduxFirestoreProvider (in charge of setting setting up and handling firestore subscriptions)
 */
export const ReduxFirestoreContext = createContext<Context>({
  setListener: () => {},
  unsetListener: () => {},
});
