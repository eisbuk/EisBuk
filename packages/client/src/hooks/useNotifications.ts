import {
  nextNotification,
  evictNotification,
} from "@/store/actions/notificationsActions";
import { getActiveNotification } from "@/store/selectors/notifications";
import { NotificationInterface } from "@/types/store";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

interface useNotificationsParams {
  timeouts: {
    minTimeout?: number;
    maxTimeout?: number;
  };
}

interface useNotifications {
  active: NotificationInterface;
  handleRemoveNotification: () => void;
}

const useNotifications: (timeouts: useNotificationsParams) => {
  active: NotificationInterface;
  handleRemoveNotification: () => void;
} = ({ timeouts: { minTimeout = 3000, maxTimeout = 4000 } }) => {
  const dispatch = useDispatch();
  const active = useSelector(getActiveNotification);
  const handleRemoveNotification = () => {
    dispatch(evictNotification());
  };
  console.log({ active });
  const afterMinTimeout = useRef<NodeJS.Timeout | null>(null);
  const afterMaxTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Possible bug: when I click next when it's exiting/other one is entering it's skipped
   */
  useEffect(() => {
    afterMinTimeout.current && clearTimeout(afterMinTimeout.current);
    afterMaxTimeout.current && clearTimeout(afterMaxTimeout.current);

    afterMinTimeout.current = setTimeout(() => {
      dispatch(nextNotification());
    }, minTimeout);

    afterMaxTimeout.current = setTimeout(() => {
      dispatch(evictNotification());
    }, maxTimeout);
  }, [active]);

  return { active, handleRemoveNotification };
};

export default useNotifications;
