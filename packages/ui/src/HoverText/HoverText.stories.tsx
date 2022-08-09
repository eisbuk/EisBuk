import React from "react";
import { ComponentMeta } from "@storybook/react";

import HoverText from "./HoverText";
import Button, { ButtonColor } from "../Button";

export default {
  title: "Hover Text",
  component: HoverText,
} as ComponentMeta<typeof HoverText>;

export const Interactive = () => (
  <HoverText
    id="hover-1"
    text="You should see this text when hovering over the button"
  >
    <Button color={ButtonColor.Primary}>Hover me</Button>
  </HoverText>
);

export const Hovered = () => (
  <>
    <h1 className="text-lg font-bold mb-4">Position: "relative"</h1>
    <div className="relative w-[200px] h-[100px] bg-gray-300 rounded-lg">
      <HoverText
        id="hover-1"
        text="You should see this text when hovering over the button"
      >
        <Button color={ButtonColor.Primary}>Hover me</Button>
      </HoverText>
    </div>
    <br />
    <h1 className="text-lg font-bold mb-4">Position: "absolute"</h1>
    <div className="relative w-[200px] h-[100px] bg-gray-300 rounded-lg">
      <HoverText
        id="hover-2"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        text="You should see this text when hovering over the button"
      >
        <Button color={ButtonColor.Primary}>Hover me</Button>
      </HoverText>
    </div>
  </>
);
Hovered.parameters = { pseudo: { hover: true } };
