import React from "react";

import { Close } from "@eisbuk/svg";

export enum NotificationToastVariant {
  Success = "success",
  Error = "error",
}

interface NotificationToastProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  variant: NotificationToastVariant;
  as?: keyof JSX.IntrinsicElements;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  variant,
  children,
  className,
  as = "div",
  ...props
}) =>
  React.createElement(
    as,
    {
      ...props,
      className: [...baseClasses, colorClassLookup[variant], className].join(
        " "
      ),
    },
    [
      <span dangerouslySetInnerHTML={{ __html: children }} />,
      <button key="close-button" className="w-5 h-5 text-white/60">
        <Close />
      </button>,
    ]
  );

const baseClasses = [
  "font-semibold",
  "px-4",
  "py-3",
  "rounded-lg",
  "text-white",
  "text-semibold",
  "select-none",
  "flex",
  "justify-between",
  "items-center",
];

const colorClassLookup = {
  [NotificationToastVariant.Success]: "bg-green-700",
  [NotificationToastVariant.Error]: "bg-red-700",
};

export default NotificationToast;
