import React, { useEffect, useState } from "react";

import { NotificationToast, NotificationToastVariant } from "@eisbuk/ui";

import { NotifVariant } from "@/enums/store";

interface Notif {
  key: string;
  message: string;
  variant: NotifVariant;
}

const NotificationsContainer: React.FC<{ active?: Notif }> = ({ active }) => {
  const [currentToast, setCurrentToast] = useState<Notif | null>(null);
  const [exitToast, setExitToast] = useState<Notif | null>(null);

  useEffect(() => {
    if (exitToast) {
      setTimeout(() => setExitToast(null), 500);
    }
  }, [exitToast]);

  useEffect(() => {
    setExitToast(currentToast || null);
    setCurrentToast(active || null);
  }, [active]);

  return (
    <div className="relative h-10 w-sm">
      {currentToast && (
        <NotificationToast
          className="!absolute top-0 z-10 animate-slide-in"
          key={currentToast?.key}
          variant={currentToast?.variant as unknown as NotificationToastVariant}
        >
          {currentToast?.message}
        </NotificationToast>
      )}
      {exitToast && (
        <NotificationToast
          className="!absolute top-0 z-0 animate-pop-out"
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
