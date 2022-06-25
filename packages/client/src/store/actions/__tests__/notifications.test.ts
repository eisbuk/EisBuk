import { NotifVariant } from "@/enums/store";
import { getNewStore } from "@/store/createStore";
import { NotificationInterface } from "@/store/reducers/notificationsReducer";
import {
  enqueueNotification,
  evictNotification,
  nextNotification,
} from "../notificationsActions";

const testNotification1 = {
  variant: NotifVariant.Success,
  message: "We tha best music!!!",
};
const testNotification2 = {
  variant: NotifVariant.Error,
  message: "U can't touch this",
};

const setupQueue = (
  store: ReturnType<typeof getNewStore>,
  notifications: Array<Omit<NotificationInterface, "key">>
) => {
  for (const notification of notifications) {
    store.dispatch(enqueueNotification(notification));
  }
};

describe("Notifications actions", () => {
  describe("enqueueNotification", () => {
    test("if queue empty, should enqueue notification assigning to it a random key and setting the 'canEvict' to false", () => {
      const store = getNewStore();

      store.dispatch(enqueueNotification(testNotification1));

      const { queue, canEvict } = store.getState().notifications;
      const [{ key, ...enqueuedNotification }] = queue;

      expect(enqueuedNotification).toEqual(testNotification1);
      expect(canEvict).toEqual(false);
      expect(key).toBeTruthy();
    });

    test("if notifications already enqueued, and 'canEvict = false' should add the new notification at the end of the queue", () => {
      const store = getNewStore();
      // By enqueueing notification(s) to set up the state, the canEvict is set to false
      setupQueue(store, [testNotification1]);

      store.dispatch(enqueueNotification(testNotification2));

      const { queue } = store.getState().notifications;
      const [
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key: key1, ...firstNotification },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key: key2, ...secondNotification },
      ] = queue;

      expect(firstNotification).toEqual(testNotification1);
      expect(secondNotification).toEqual(testNotification2);
    });

    test("if notification already enqueued, but 'canEvict = true' should replace the enqueued notification with the new one", () => {
      const store = getNewStore();
      // By enqueueing notification(s) to set up the state, the 'canEvict' is set to false
      setupQueue(store, [testNotification1]);
      // By performing 'nextNotification' on single member queue, the 'canEvict' is set to true
      store.dispatch(nextNotification());

      store.dispatch(enqueueNotification(testNotification2));

      const { queue, canEvict } = store.getState().notifications;
      const [
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key, ...firstNotification },
      ] = queue;

      expect(queue.length).toEqual(1);
      expect(firstNotification).toEqual(testNotification2);
      expect(canEvict).toEqual(false);
    });
  });

  describe("nextNotification", () => {
    test("should remove the first notification from the queue if there are other notifications enqueued", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1, testNotification2]);

      store.dispatch(nextNotification());

      const { queue } = store.getState().notifications;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ key, ...firstNotification }] = queue;

      expect(queue.length).toEqual(1);
      expect(firstNotification).toEqual(testNotification2);
    });

    test("should not remove the notification from the queue if there's only the one, but should set canEvict to 'true'", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1]);

      store.dispatch(nextNotification());

      const { queue, canEvict } = store.getState().notifications;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ key, ...firstNotification }] = queue;

      expect(queue.length).toEqual(1);
      expect(firstNotification).toEqual(testNotification1);
      expect(canEvict).toEqual(true);
    });
  });

  describe("evictNotification", () => {
    test("should remove the first notification regardless of additional notifications being enqueued or not, canEvict should be set to 'false'", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1, testNotification2]);

      // Evict once, removing the first notification while the second enqueued becomes the first
      store.dispatch(evictNotification());
      const { queue: queue1, canEvict: canEvict1 } =
        store.getState().notifications;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ key, ...firstNotification1 }] = queue1;
      expect(queue1.length).toEqual(1);
      expect(firstNotification1).toEqual(testNotification2);
      expect(canEvict1).toEqual(false);

      // Evict again to assure the norification will get removed, regardless of it being the only one in the queue
      // resulting in an empty queue
      store.dispatch(evictNotification());
      const { queue: queue2, canEvict: canEvict2 } =
        store.getState().notifications;
      expect(queue2).toEqual([]);
      expect(canEvict2).toEqual(false);
    });

    test("should set 'canEvict' to false when evicting", () => {
      const store = getNewStore();
      // canEvict is set to 'false' when setting up the state
      setupQueue(store, [testNotification1]);
      // Set canEvict to 'true' by performing 'nextNotification' on one notification queue
      store.dispatch(nextNotification());

      // Evict once, removing the first notification while the second enqueued becomes the first
      store.dispatch(evictNotification());
      const { canEvict: canEvict } = store.getState().notifications;
      expect(canEvict).toEqual(false);
    });

    test("should not break if performed on an empty queue", () => {
      const store = getNewStore();
      store.dispatch(evictNotification());
      const { queue } = store.getState().notifications;
      expect(queue).toEqual([]);
    });
  });
});
