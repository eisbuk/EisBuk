import React from "react";

import { __notificationToastId__ } from "@eisbuk/testing/testIds";

import { Close } from "@eisbuk/svg";

export enum NotificationToastVariant {
  Success = "success",
  Error = "error",
}

interface NotificationToastProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  variant: NotificationToastVariant;
  onClose?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  variant,
  children,
  className,
  as = "div",
  onClose = () => {},
  ...props
}) =>
  React.createElement(
    as,
    {
      ...props,
      className: [...baseClasses, colorClassLookup[variant], className].join(
        " "
      ),
      "data-testid": __notificationToastId__,
    },
    [
      <span
        key="content"
        className="md:whitespace-nowrap"
        dangerouslySetInnerHTML={{ __html: children }}
      />,
      <button
        onClick={() => onClose()}
        key="close-button"
        className="w-5 h-5 absolute top-1/2 -translate-y-1/2 right-3 text-white/60"
      >
        <Close />
      </button>,
    ]
  );

const baseClasses = [
  "min-w-[360px]",
  "inline-block",
  "relative",
  "pl-3",
  "pr-10", // Offset for absolutely positioned 'x' button
  "py-2",
  "rounded-lg",
  "font-medium",
  "text-white",
  "select-none",
  "justify-between",
  "items-center",
];

const colorClassLookup = {
  [NotificationToastVariant.Success]: "bg-green-700",
  [NotificationToastVariant.Error]: "bg-red-700",
};

export default NotificationToast;
