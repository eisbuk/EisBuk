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
      <span key="exclamation-circle" className="w-8 h-8 mr-2">
        <ExclamationCircle />
      </span>,
      <span dangerouslySetInnerHTML={{ __html: children }} />,
    ]
  );

const baseClasses = [
  "px-4",
  "py-3",
  "border-2",
  "border-gray-200",
  "rounded-lg",
  "text-gray-500",
  "text-base",
  "select-none",
  "flex",
  "items-center",
];

export default EmptySpace;
