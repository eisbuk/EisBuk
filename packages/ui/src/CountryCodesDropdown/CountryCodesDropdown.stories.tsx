import React from "react";
import { ComponentMeta } from "@storybook/react";

import CountryCodesDropdown from "./CountryCodesDropdown";

export default {
  title: "Country Codes",
  component: CountryCodesDropdown,
} as ComponentMeta<typeof CountryCodesDropdown>;

export const Default = (): JSX.Element => (
  <CountryCodesDropdown onChange={() => {}} />
);
