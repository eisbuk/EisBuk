import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import DateNavigation from "./DateNavigation";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  CopyButton,
  PasteButton,
  DeleteButton,
} from "@/components/atoms/SlotOperationButtons";
import { PrintButton } from "../AttendanceSheet/PrintButton";

export default {
  title: "Date Navigation",
  component: DateNavigation,
} as ComponentMeta<typeof DateNavigation>;

// #region setup

// we're using a standardized date not to fallback to current date and produce false positives with chromatic
const defaultDateISO = "2021-03-01";
const defaultDate = DateTime.fromISO(defaultDateISO);

const confirmDialog = {
  title: "Confirm Dialog",
  description: "Confirm you wish to delete",
};

const extraButtonProps = {
  date: defaultDate,
  slotsToCopy: {
    [ButtonContextType.Week]: true,
  },
};
// #endregion setup

// #region differentTimeframe

// All of the stories of this region are default
// with changing timefreme (jump) value

export const Week = (): JSX.Element => (
  <DateNavigation defaultDate={defaultDate} />
);

export const Day = (): JSX.Element => (
  <DateNavigation defaultDate={defaultDate} jump="day" />
);

export const Month = (): JSX.Element => (
  <DateNavigation defaultDate={defaultDate} jump="month" />
);

// #endregion differentTimeframe

// #region otherOptions
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

const extraButtons = (
  <SlotOperationButtons {...extraButtonProps}>
    <CopyButton />
    <PasteButton size="medium" />
    <DeleteButton confirmDialog={confirmDialog} />
  </SlotOperationButtons>
);

const printButton = <PrintButton />;

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
  <DateNavigation {...{ extraButtons }} />
);

export const WithCopyPasteAndToggle = (): JSX.Element => (
  <DateNavigation {...{ extraButtons }} showToggle />
);
export const WithPrintButton = (): JSX.Element => (
  <DateNavigation {...{ extraButtons: printButton }} />
);
// #endregion otherOptions
