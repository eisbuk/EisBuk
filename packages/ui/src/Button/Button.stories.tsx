import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Users, Calendar, Mail, Phone, Printer } from "@eisbuk/svg";

import Button, { ButtonColor, ButtonSize, ButtonIcon } from "./Button";

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
    </StorybookGrid>
  </>
);

const durationIce = <div className="bg-cyan-600 rounded-md px-1">2h</div>;
const durationOffIce = <div className="bg-yellow-700 rounded-md px-1">2h</div>;
const durationDisabled = <div className="bg-gray-300 rounded-md px-1">2h</div>;

export const Prototype = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Interval Card:</h1>
    <StorybookGrid className="mb-16">
      <StorybookItem label="Book Ice">
        <Button
          className="min-w-[85px]"
          color={ButtonColor.Primary}
          endAdornment={durationIce}
        >
          Book
        </Button>
      </StorybookItem>
      <StorybookItem label="Book Off Ice">
        <Button
          className="min-w-[85px]"
          color={ButtonColor.Secondary}
          endAdornment={durationOffIce}
        >
          Book
        </Button>
      </StorybookItem>
      <StorybookItem label="Cancel">
        <Button
          className="min-w-[85px] justify-center"
          color={ButtonColor.Error}
        >
          Cancel
        </Button>
      </StorybookItem>
      <StorybookItem label="Disabled">
        <Button
          className="min-w-[85px]"
          endAdornment={durationDisabled}
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

    <h1 className="text-lg font-bold mb-4">Icon Button:</h1>
    <StorybookGrid className="mb-16">
      <StorybookItem>
        <Button
          className="text-gray-700 h-10 w-10 !p-1 rounded-full hover:bg-gray-100"
          size={ButtonSize.LG}
        >
          <Printer />
        </Button>
      </StorybookItem>
    </StorybookGrid>

    <h1 className="text-lg font-bold mb-4">Admin links:</h1>
    <StorybookItem>
      <div className="bg-gray-700 p-2">
        <div className="overflow-hidden h-10 text-white hidden items-center border-2 rounded-lg divide-x-2 md:flex">
          <Button
            className="h-full rounded-none  items-end  text-opacity-80 hover:bg-white/5 active:bg-white/10"
            startAdornment={<ButtonIcon I={Users} />}
          >
            <span className=" ">Athletes</span>
          </Button>
          <Button
            className="h-full rounded-none   text-opacity-80 hover:bg-white/5 active:bg-white/10"
            startAdornment={<ButtonIcon I={Users} />}
          >
            Athletes
          </Button>
          <Button
            className="h-full rounded-none   text-opacity-80 hover:bg-white/5 active:bg-white/10"
            startAdornment={<ButtonIcon I={Users} />}
          >
            Athletes
          </Button>
          <Button
            className="h-full rounded-none   text-opacity-80 hover:bg-white/5 active:bg-white/10"
            startAdornment={<ButtonIcon I={Users} />}
          >
            Athletes
          </Button>
        </div>
      </div>
    </StorybookItem>

    <h1 className="text-lg font-bold mb-4">Admin links:</h1>
    <StorybookItem>
      <div className="flex flex-wrap my-8 justify-start items-center gap-2">
        <Button
          className="min-w-24 !text-gray-700 whitespace-nowrap bg-cyan-200 hover:bg-cyan-100"
          size={ButtonSize.LG}
          startAdornment={<ButtonIcon I={Calendar} />}
        >
          Bookings
        </Button>
        <Button
          className="min-w-24 !text-gray-700 whitespace-nowrap bg-cyan-200 hover:bg-cyan-100"
          size={ButtonSize.LG}
          startAdornment={<ButtonIcon I={Mail} />}
        >
          Send bookings link email
        </Button>
        <Button
          className="min-w-24 !text-gray-700 whitespace-nowrap bg-cyan-200 hover:bg-cyan-100"
          size={ButtonSize.LG}
          startAdornment={<ButtonIcon I={Phone} />}
        >
          Send bookings link SMS
        </Button>
      </div>
    </StorybookItem>
  </>
);
