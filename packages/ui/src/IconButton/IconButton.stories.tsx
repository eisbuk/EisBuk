import React from "react";
import { ComponentMeta } from "@storybook/react";

import { Cake } from "@eisbuk/svg";

import IconButton, {
  IconButtonBackground,
  IconButtonContentSize,
  IconButtonShape,
  IconButtonSize,
} from "./IconButton";

import { StorybookGrid, StorybookItem } from "../utils/storybook";

export default {
  title: "Icon Button",
  component: IconButton,
} as ComponentMeta<typeof IconButton>;

export const SizeVariants = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">
      'hover' state is induced to make the background visible
    </h1>
    <StorybookGrid>
      <StorybookItem label="XS">
        <IconButton
          hoverBackground={IconButtonBackground.Dark}
          size={IconButtonSize.XS}
          contentSize={IconButtonContentSize.Tight}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
      <StorybookItem label="MD">
        <IconButton
          hoverBackground={IconButtonBackground.Dark}
          size={IconButtonSize.MD}
          contentSize={IconButtonContentSize.Tight}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
      <StorybookItem label="LG">
        <IconButton
          hoverBackground={IconButtonBackground.Dark}
          size={IconButtonSize.LG}
          contentSize={IconButtonContentSize.Tight}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
    </StorybookGrid>
  </>
);
SizeVariants.parameters = { pseudo: { hover: true } };

export const ShapeVariants = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">
      'hover' state is induced to make the background visible
    </h1>
    <StorybookGrid>
      <StorybookItem label="Square">
        <IconButton
          size={IconButtonSize.LG}
          contentSize={IconButtonContentSize.Relaxed}
          hoverBackground={IconButtonBackground.Dark}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
      <StorybookItem label="Rounded">
        <IconButton
          size={IconButtonSize.LG}
          contentSize={IconButtonContentSize.Relaxed}
          hoverBackground={IconButtonBackground.Dark}
          shape={IconButtonShape.Round}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
    </StorybookGrid>
  </>
);
ShapeVariants.parameters = { pseudo: { hover: true } };

export const ContentSizeVariants = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">
      'hover' state is induced to make the background visible
    </h1>
    <StorybookGrid>
      <StorybookItem label="Tight">
        <IconButton
          hoverBackground={IconButtonBackground.Dark}
          size={IconButtonSize.LG}
          contentSize={IconButtonContentSize.Tight}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
      <StorybookItem label="Medium">
        <IconButton
          hoverBackground={IconButtonBackground.Dark}
          size={IconButtonSize.LG}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
      <StorybookItem label="Relaxed">
        <IconButton
          hoverBackground={IconButtonBackground.Dark}
          size={IconButtonSize.LG}
          contentSize={IconButtonContentSize.Relaxed}
        >
          <Cake />
        </IconButton>
      </StorybookItem>
    </StorybookGrid>
  </>
);
ContentSizeVariants.parameters = { pseudo: { hover: true } };
