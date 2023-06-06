import { functions, db } from "@/setup";
import { FirestoreVariant } from "@/utils/firestore/compat";

import { getNewStore } from "./createStore";

export const store = getNewStore(
  {},
  {
    // We're adding an extra argument (containing 'getFirestore' and 'getFunctions') to the thunk middleware so that
    // we can use it as dependency injection in tests, rather than mocking.
    //
    // For 'getFirestore', the returned object is not firestore object itself, but a FirestoreVariant, used to
    // be able to accept different firestore implementations (client SDK, node SDK and compat) and use them in a uniform way.
    // Here, in the client app, we're passing a client SDK variant, but tests might pass a different one when testing the thunks themeslves.
    getFirestore: () => FirestoreVariant.client({ instance: db }),
    // The 'getFunctions' returns an instantiated functions object, connected to the emulators (if running in dev mode)
    getFunctions: () => functions,
  }
);
