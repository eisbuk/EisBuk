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
    test("should enqueue notification assigning to it a random key", () => {
      const store = getNewStore();

      store.dispatch(enqueueNotification(testNotification1));

      const { queue } = store.getState().notifications;
      const [{ key, ...enqueuedNotification }] = queue;

      expect(enqueuedNotification).toEqual(testNotification1);
      expect(key).toBeTruthy();
    });

    test("if notifications already enqueued, should add the new notification at the end of the queue", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1]);

      store.dispatch(enqueueNotification(testNotification2));

      const { queue } = store.getState().notifications;
      const [
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key: key1, ...firstNotificaiton },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key: key2, ...secondNotification },
      ] = queue;

      expect(firstNotificaiton).toEqual(testNotification1);
      expect(secondNotification).toEqual(testNotification2);
    });
  });

  describe("nextNotification", () => {
    test("should remove the first notification from the queue if there are other notifications enqueued", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1, testNotification2]);

      store.dispatch(nextNotification());

      const { queue } = store.getState().notifications;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ key, ...firstNotificaiton }] = queue;

      expect(queue.length).toEqual(1);
      expect(firstNotificaiton).toEqual(testNotification2);
    });

    test("should do nothing if there's only one notification in the queue", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1]);

      store.dispatch(nextNotification());

      const { queue } = store.getState().notifications;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ key, ...firstNotificaiton }] = queue;

      expect(queue.length).toEqual(1);
      expect(firstNotificaiton).toEqual(testNotification1);
    });
  });

  describe("evictNotification", () => {
    test("should remove the first notification regardless of additional notifications being enqueued or not", () => {
      const store = getNewStore();
      setupQueue(store, [testNotification1, testNotification2]);

      // Evict once, removing the first notification while the second enqueued becomes the first
      store.dispatch(evictNotification());
      const { queue: queue1 } = store.getState().notifications;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ key, ...firstNotificaiton1 }] = queue1;
      expect(queue1.length).toEqual(1);
      expect(firstNotificaiton1).toEqual(testNotification2);

      // Evict again to assure the norification will get removed, regardless of it being the only one in the queue
      // resulting in an empty queue
      store.dispatch(evictNotification());
      const { queue: queue2 } = store.getState().notifications;
      expect(queue2).toEqual([]);
    });

    test("should not break if performed on an empty queue", () => {
      const store = getNewStore();
      store.dispatch(evictNotification());
      const { queue } = store.getState().notifications;
      expect(queue).toEqual([]);
    });
  });
});
