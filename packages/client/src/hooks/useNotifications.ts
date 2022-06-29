import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  nextNotification,
  evictNotification,
} from "@/store/actions/notificationsActions";
import { getActiveNotification } from "@/store/selectors/notifications";

import { NotificationInterface } from "@/types/store";

interface Timeouts {
  minTimeout?: number;
  maxTimeout?: number;
}
interface UseNotificationsHook {
  (timeouts: Timeouts): {
    active: NotificationInterface | undefined;
    handleRemoveNotification: () => void;
  };
}

const useNotifications: UseNotificationsHook = ({
  minTimeout = 3000,
  maxTimeout = 4000,
}) => {
  const dispatch = useDispatch();
  const active = useSelector(getActiveNotification);
  const handleRemoveNotification = () => {
    dispatch(evictNotification());
  };
  const afterMinTimeout = useRef<NodeJS.Timeout | null>(null);
  const afterMaxTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    afterMinTimeout.current = setTimeout(() => {
      dispatch(nextNotification());
    }, minTimeout);

    afterMaxTimeout.current = setTimeout(() => {
      dispatch(evictNotification());
    }, maxTimeout);

    return () => {
      afterMinTimeout.current && clearTimeout(afterMinTimeout.current);
      afterMaxTimeout.current && clearTimeout(afterMaxTimeout.current);
    };
  }, [active]);

  return { active, handleRemoveNotification };
};

export default useNotifications;
