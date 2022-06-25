import { NotifVariant } from "@/enums/store";
import { getNewStore } from "@/store/createStore";
import { NotificationInterface } from "@/store/reducers/notificationsReducer";
import { enqueueNotification, nextNotification } from "../notificationsActions";

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
});
