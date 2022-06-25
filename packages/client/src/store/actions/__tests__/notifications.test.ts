import { NotifVariant } from "@/enums/store";
import { getNewStore } from "@/store/createStore";
import { enqueueNotification } from "../notificationsActions";

const testNotification = {
  variant: NotifVariant.Success,
  message: "We tha best music!!!",
};

describe("Notifications actions", () => {
  describe("enqueueNotification", () => {
    test("should enqueue notification assigning to it a random key", () => {
      const store = getNewStore();
      store.dispatch(enqueueNotification(testNotification));
      const { queue } = store.getState().notifications;
      const [{ key, ...enqueuedNotification }] = queue;

      expect(enqueuedNotification).toEqual(testNotification);
      expect(key).toBeTruthy();
    });

    test("if notifications already enqueued, should add the new notification at the end of the queue", () => {
      const existingNotification = {
        variant: NotifVariant.Error,
        message: "U can't touch this",
      };
      const store = getNewStore();
      store.dispatch(enqueueNotification(existingNotification));
      store.dispatch(enqueueNotification(testNotification));
      const { queue } = store.getState().notifications;
      const [
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key: key1, ...firstNotificaiton },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { key: key2, ...secondNotification },
      ] = queue;
      expect(firstNotificaiton).toEqual(existingNotification);
      expect(secondNotification).toEqual(testNotification);
    });
  });
});
