import React from "react";

import { AccountCircle, Calendar } from "@eisbuk/svg";

import UserAvatar from "../UserAvatar";
import TabItem from "../TabItem";
import NotificationToast, {
  NotificationToastVariant,
} from "../NotificationToast";

const Layout: React.FC = () => {
  const rowClasses = "flex justify-between items-center w-full h-[70px]";

  return (
    <div className="bg-gray-800">
      <div className="content-container">
        <div className={rowClasses}>
          <div className="h-5 w-[86px] border-2 border-green-700" />
          <UserAvatar
            name="Salvo"
            surname="Simonetti"
            avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          />
        </div>

        <div className="w-full h-[2px] bg-gray-700" />

        <div className={rowClasses}>
          <div className="flex max-w-1/2 gap-[10px]">
            <TabItem Icon={AccountCircle} label="Book" active={true} />
            <TabItem Icon={Calendar} label="Calendar" />
          </div>
          <div>
            <NotificationToast variant={NotificationToastVariant.Success}>
              {`April 13th 08:00 - 09:00, <strong>confirmed</strong>`}
            </NotificationToast>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
