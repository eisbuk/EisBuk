import React from "react";

import { ExclamationCircle } from "@eisbuk/svg";

interface EmptySpaceProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: keyof JSX.IntrinsicElements;
}

const EmptySpace: React.FC<EmptySpaceProps> = ({
  children,
  className,
  as = "div",
  ...props
}) =>
  React.createElement(
    as,
    {
      ...props,
      className: [...baseClasses, className].join(" "),
    },
    [
      <span key="exclamation-circle" className="w-6 h-6 mb-2 md:mb-0 md:mr-2">
        <ExclamationCircle />
      </span>,
      <span
        className="max-w-[187px] text-center md:max-w-none md:whitespace-nowrap"
        dangerouslySetInnerHTML={{ __html: children }}
      />,
    ]
  );

const baseClasses = [
  "py-8",
  "border-2",
  "border-gray-200",
  "rounded-lg",
  "text-gray-500",
  "text-base",
  "select-none",
  "flex",
  "flex-col",
  "items-center",
  "md:flex-row",
  "md:px-4",
  "md:py-3",
];

export default EmptySpace;
