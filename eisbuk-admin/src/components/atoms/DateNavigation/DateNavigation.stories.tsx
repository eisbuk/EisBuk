import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import DateNavigation from "./DateNavigation";
import CopyPasteWeekButtons from "@/components/atoms/CopyPasteWeekButtons";

export default {
  title: "Date Navigation",
  component: DateNavigation,
} as ComponentMeta<typeof DateNavigation>;

// we're using a standardized date not to fallback to current date and produce false positives with chromatic
const defaultDateISO = "2021-03-01";
const defaultDate = DateTime.fromISO(defaultDateISO);

// ***** Region Different Timeframe ***** //

// All of the stories of this region are default
// with changing timefrema (jump) value

export const Week = (): JSX.Element => (
  <DateNavigation defaultDate={defaultDate} />
);

export const Day = (): JSX.Element => (
  <DateNavigation defaultDate={defaultDate} jump="day" />
);

export const Month = (): JSX.Element => (
  <DateNavigation defaultDate={defaultDate} jump="month" />
);

// ***** End Region Different Timeframe ***** //

// ***** Region Other Options ***** //

// All of the below stories will feature the default ("week")
// value for `jump` and will showcase different rendering of additional options

const centerContainer = {
  marginTop: 100,
  position: "relative",
} as React.CSSProperties;
const center = {
  position: "absolute",
  left: "50%",
  transform: "translatex(-50%)",
} as React.CSSProperties;

export const WithToggleButton = (): JSX.Element => (
  <DateNavigation showToggle>
    {({ toggleState }) => (
      <div style={centerContainer}>
        <h1 style={center}>Current Toggle State: {String(toggleState)}</h1>
      </div>
    )}
  </DateNavigation>
);

export const WithCopyPaste = (): JSX.Element => (
  <DateNavigation extraButtons={<CopyPasteWeekButtons />} />
);

export const WithCopyPasteAndToggle = (): JSX.Element => (
  <DateNavigation extraButtons={<CopyPasteWeekButtons />} showToggle />
);

// ***** End Region Other Options ***** //
