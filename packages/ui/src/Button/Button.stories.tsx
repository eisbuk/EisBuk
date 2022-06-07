import React from "react";
import { ComponentMeta } from "@storybook/react";

import Button, { ButtonColor, ButtonSize } from "./Button";

import { StorybookGrid, StorybookItem } from "../utils/storybook";

export default {
  title: "Button",
  component: Button,
} as ComponentMeta<typeof Button>;

const buttonText = "Button text";

export const Variants = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Size: "base"</h1>
    <StorybookGrid className="mb-16">
      <StorybookItem label="Primary">
        <Button color={ButtonColor.Primary}>{buttonText}</Button>
      </StorybookItem>
      <StorybookItem label="Secondary">
        <Button color={ButtonColor.Secondary}>{buttonText}</Button>
      </StorybookItem>
      <StorybookItem label="Error">
        <Button color={ButtonColor.Error}>{buttonText}</Button>
      </StorybookItem>
      <StorybookItem label="Disabled">
        <Button disabled>{buttonText}</Button>
      </StorybookItem>
    </StorybookGrid>
    <h1 className="text-lg font-bold mb-4">Size: "lg"</h1>
    <StorybookGrid className="mb-16">
      <StorybookItem label="Primary">
        <Button size={ButtonSize.LG} color={ButtonColor.Primary}>
          {buttonText}
        </Button>
      </StorybookItem>
      <StorybookItem label="Secondary">
        <Button size={ButtonSize.LG} color={ButtonColor.Secondary}>
          {buttonText}
        </Button>
      </StorybookItem>
      <StorybookItem label="Error">
        <Button size={ButtonSize.LG} color={ButtonColor.Error}>
          {buttonText}
        </Button>
      </StorybookItem>
      <StorybookItem label="Disabled">
        <Button size={ButtonSize.LG} disabled>
          {buttonText}
        </Button>
      </StorybookItem>
      <StorybookItem label="No color">
        <Button size={ButtonSize.LG} disabled>
          {buttonText}
        </Button>
      </StorybookItem>
    </StorybookGrid>
  </>
);

const durationIce = () => <div className="bg-cyan-600 rounded-md px-1">2h</div>;
const durationOffIce = () => (
  <div className="bg-yellow-700 rounded-md px-1">2h</div>
);
const durationDisabled = () => (
  <div className="bg-gray-300 rounded-md px-1">2h</div>
);

export const Prototype = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Interval Card:</h1>
    <StorybookGrid className="mb-16">
      <StorybookItem label="Book Ice">
        <Button
          className="min-w-[85px]"
          color={ButtonColor.Primary}
          EndAdornment={durationIce}
        >
          Book
        </Button>
      </StorybookItem>
      <StorybookItem label="Book Off Ice">
        <Button
          className="min-w-[85px]"
          color={ButtonColor.Secondary}
          EndAdornment={durationOffIce}
        >
          Book
        </Button>
      </StorybookItem>
      <StorybookItem label="Cancel">
        <Button className="min-w-[85px]" color={ButtonColor.Error}>
          Cancel
        </Button>
      </StorybookItem>
      <StorybookItem label="Disabled">
        <Button
          className="min-w-[85px]"
          EndAdornment={durationDisabled}
          disabled
        >
          Book
        </Button>
      </StorybookItem>
    </StorybookGrid>

    <h1 className="text-lg font-bold mb-4">Action Dialog:</h1>
    <StorybookGrid className="mb-16">
      <StorybookItem>
        <Button
          className="text-gray-700 font-medium bg-gray-100 hover:bg-opacity-0"
          size={ButtonSize.LG}
        >
          Go Back
        </Button>
      </StorybookItem>
      <StorybookItem>
        <Button
          className="text-red-700 bg-red-200 hover:bg-red-100"
          size={ButtonSize.LG}
        >
          Confirm Cancellation
        </Button>
      </StorybookItem>
    </StorybookGrid>
  </>
);
