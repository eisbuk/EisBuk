import { describe, expect, test } from "vitest";
import { NotificationInterface } from "../types";

import { NotifVariant } from "@/enums/store";

import { getNewStore } from "@/store/createStore";

import {
  enqueueNotification,
  evictNotification,
  nextNotification,
} from "../actions";

// #region tableTestRunner
interface TestParams {
  name: string;
  testQueue: Omit<NotificationInterface, "key">[];
  testCanEvict: boolean;
  run: (store: ReturnType<typeof getNewStore>) => void;
  wantQueue?: Omit<NotificationInterface, "key">[];
  wantCanEvict?: boolean;
}

const setupQueue = (
  store: ReturnType<typeof getNewStore>,
  notifications: Array<Omit<NotificationInterface, "key">>
) => {
  for (const notification of notifications) {
    store.dispatch(enqueueNotification(notification));
  }
};

const runNotificationsTableTests = (tests: TestParams[]) => {
  tests.forEach(
    ({ name, testQueue, testCanEvict, run, wantQueue, wantCanEvict }) =>
      test(name, () => {
        // Fail for non existing scenario
        if (testQueue.length > 1 && testCanEvict) {
          throw new Error(
            `canEvict can only be 'true' on empty and single notification queue. The testQueue you've provided has length ${
              testQueue.length
            }. Test queue:
                  ${JSON.stringify(testQueue)}        
                  `
          );
        }

        // Setup test
        const store = getNewStore();
        setupQueue(store, testQueue);
        if (testCanEvict) {
          // If 'canEvict' part of the setup, run 'nextNotification' setting it to 'true' in the store
          // We've already handled the non existing cases of canEvict at the top of the function block
          store.dispatch(nextNotification());
        }

        // Run the test
        run(store);

        // Make assertions
        const { canEvict: resCanEvict, queue } = store.getState().notifications;

        if (wantQueue) {
          // Get the resulting queue from store, but remove the randomly generated keys for easier comparisosn
          const resQueue = queue.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ key, ...notification }) => notification
          );

          expect(resQueue).toEqual(wantQueue);
        }

        if (wantCanEvict) {
          expect(resCanEvict).toEqual(wantCanEvict);
        }
      })
  );
};
// #endregion tableTestRunner

// #region tests
const testNotification1 = {
  variant: NotifVariant.Success,
  message: "We tha best music!!!",
};
const testNotification2 = {
  variant: NotifVariant.Error,
  message: "U can't touch this",
};

describe("Notification store table tests", () => {
  runNotificationsTableTests([
    {
      name: "Enqueue action: if queue empty, should enqueue notification and set 'canEvict' to false",
      testQueue: [],
      testCanEvict: true,
      run: (store) => {
        store.dispatch(enqueueNotification(testNotification1));
      },
      wantQueue: [testNotification1],
      wantCanEvict: false,
    },
    {
      name: "Enqueue action: if queue not empty and 'canEvict' false, should enqueue new notificaiton at the end of the queue",
      testQueue: [testNotification1],
      testCanEvict: false,
      run: (store) => {
        store.dispatch(enqueueNotification(testNotification2));
      },
      wantQueue: [testNotification1, testNotification2],
      wantCanEvict: false,
    },
    {
      name: "Enqueue action: if queue not empty, but 'canEvict' true, should evict existing notification and replace with the new one",
      testQueue: [testNotification1],
      testCanEvict: true,
      run: (store) => {
        store.dispatch(enqueueNotification(testNotification2));
      },
      wantQueue: [testNotification2],
      wantCanEvict: false,
    },

    {
      name: "Next action: if queue longer than 1, should move to the next notification (by evicting the currently first)",
      testQueue: [testNotification1, testNotification2],
      testCanEvict: false,
      run: (store) => {
        store.dispatch(nextNotification());
      },
      wantQueue: [testNotification2],
      wantCanEvict: false,
    },
    {
      name: "Next action: if only one notification in queue, should not evict the notification, but set 'canEvict' to true",
      testQueue: [testNotification1],
      testCanEvict: false,
      run: (store) => {
        store.dispatch(nextNotification());
      },
      wantQueue: [testNotification1],
      wantCanEvict: true,
    },

    {
      name: "Evict action: should remove first notification regardless of it being the only one",
      testQueue: [testNotification1],
      testCanEvict: false,
      run: (store) => {
        store.dispatch(evictNotification());
      },
      wantQueue: [],
      wantCanEvict: false,
    },
    {
      name: "Evict action: should always set 'canEvict' to false when evicting",
      testQueue: [testNotification1],
      testCanEvict: true,
      run: (store) => {
        store.dispatch(evictNotification());
      },
      wantQueue: [],
      wantCanEvict: false,
    },
    {
      name: "Evict action: should not break on empty queue",
      testQueue: [],
      testCanEvict: true,
      run: (store) => {
        store.dispatch(evictNotification());
      },
      wantQueue: [],
    },
  ]);
});
// #endregion tests
