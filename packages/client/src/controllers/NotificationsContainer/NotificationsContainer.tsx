import React, { useEffect, useState } from "react";

import { NotificationToast, NotificationToastVariant } from "@eisbuk/ui";

import { NotifVariant } from "@/enums/store";

/** This is @TEMP until other parts are integrated */
interface Notif {
  key: string;
  message: string;
  variant: NotifVariant;
}

/**
 * A controller component used to display notifications in an orderly fashion. It connects to the store
 * and receives from it the active notification.
 */
const NotificationsContainer: React.FC<{
  active?: Notif;
  className?: string;
}> = ({ active, className = "" }) => {
  // Current Toast is currently shown one. It has an entry animation and stays in place
  const [currentToast, setCurrentToast] = useState<Notif | null>(null);
  // Exit Toast is the previously shown toast. I is set here so that it's rendered anew (when exiting)
  // for a limited time (enough to show the exit animation) and then removed.
  const [exitToast, setExitToast] = useState<Notif | null>(null);

  // Control the removal of exit toast from the DOM after the exit animation is finished
  useEffect(() => {
    if (exitToast) {
      const timeout = setTimeout(() => setExitToast(null), 500);

      // Clear timeout in case of unmount or, extremely unlikely case of exit toast
      // being changed before the animation runs out
      return () => {
        if (timeout) {
          clearTimeout();
        }
      };
    }

    // Return an empty function if no timeout has been set so that TS doesn't complain
    return () => {};
  }, [exitToast]);

  // When new toast comes in, set it as active and set the previous one (if any) to exit
  useEffect(() => {
    setExitToast(currentToast || null);
    setCurrentToast(active || null);
  }, [active]);

  return (
    <div className={["relative h-10 w-full", className].join(" ")}>
      {currentToast && (
        <NotificationToast
          className="!absolute top-0 right-0 z-10 animate-slide-in"
          key={currentToast?.key}
          variant={currentToast?.variant as unknown as NotificationToastVariant}
        >
          {currentToast?.message}
        </NotificationToast>
      )}
      {exitToast && (
        <NotificationToast
          className="!absolute top-0 right-0 z-0 animate-pop-out"
          key={exitToast?.key}
          variant={exitToast?.variant as unknown as NotificationToastVariant}
        >
          {exitToast?.message}
        </NotificationToast>
      )}
    </div>
  );
};

export default NotificationsContainer;
