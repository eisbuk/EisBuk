import React from "react";

import { Button, ButtonProps } from "@eisbuk/ui";

const SlotOperationButton: React.FC<ButtonProps> = ({
  className,
  disabled,
  ...props
}) => {
  const color = disabled ? "!text-gray-300" : "hover:bg-gray-200";
  const cursor = disabled ? "cursor-default" : "cursor-pointer";

  return (
    <Button
      className={[
        "h-8 w-8 !p-1 text-gray-600 rounded-full overflow-hidden",
        color,
        cursor,
        className,
      ].join(" ")}
      {...props}
    />
  );
};

export default SlotOperationButton;
