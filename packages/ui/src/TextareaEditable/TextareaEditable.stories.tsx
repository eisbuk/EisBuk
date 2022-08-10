import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import TextareaEditable from "./TextareaEditable";
import Button, { ButtonColor } from "../Button";

export default {
  title: "Textarea Editable",
  component: TextareaEditable,
} as ComponentMeta<typeof TextareaEditable>;

const initialValue =
  "The quick brown fox jumps over the lazy dog while colourless green ideas sleep furiously.";

export const Interactive = (): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValue(e.target.value);

  const baseClasses = "h-full w-full rounded border-2";
  const nonActiveBorder = "border-transparent";
  const activeBorder = "border-cyan-500";
  const className = [
    baseClasses,
    isEditing ? activeBorder : nonActiveBorder,
  ].join(" ");

  return (
    <div className="flex items-center gap-2">
      <div className="h-[100px] w-[400px]">
        <TextareaEditable {...{ value, onChange, isEditing, className }} />
      </div>
      <Button
        onClick={() => setIsEditing(!isEditing)}
        color={ButtonColor.Primary}
      >
        {isEditing ? "Disable Edit" : "Enable Edit"}
      </Button>
    </div>
  );
};
