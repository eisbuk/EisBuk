import React from "react";
import DateSwitcher from "./DateSwitcher";
import { ComponentMeta } from "@storybook/react";
import AdapterDateFns from "@mui/lab/AdapterLuxon";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import { DateTime } from "luxon";

export default {
  title: "Date Switcher",
  component: DateSwitcher,
} as ComponentMeta<typeof DateSwitcher>;

// we're using a standardized date not to fallback to current date and produce false positives with chromatic
const defaultDateISO = "2021-03-01";
const defaultDate = DateTime.fromISO(defaultDateISO);

export const Default = (): JSX.Element => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <DateSwitcher
      currentDate={defaultDate}
      open={true}
      anchorEl={null}
      handleClose={() => {}}
    />
  </LocalizationProvider>
);
