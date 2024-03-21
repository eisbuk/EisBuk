import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import BookingDateDebugDialog from "./BookingDateDebugDialog";

export default {
  title: "Booking Date Debug Dialog",
  component: BookingDateDebugDialog,
} as ComponentMeta<typeof BookingDateDebugDialog>;

export const Interactive = (): JSX.Element => {
  const [_systemDate, setSystemDate] = React.useState(
    DateTime.now().toISODate()
  );
  const systemDate = {
    value: _systemDate,
    onChange: setSystemDate,
    navigate: (delta: -1 | 1) => () =>
      setSystemDate(
        DateTime.fromISO(_systemDate).plus({ days: delta }).toISODate()
      ),
  };

  const [_extendedDate, setExtendedDate] = React.useState(
    DateTime.now().toISODate()
  );
  const extendedDate = {
    value: _extendedDate,
    onChange: setExtendedDate,
    navigate: (delta: -1 | 1) => () =>
      setExtendedDate(
        DateTime.fromISO(_extendedDate).plus({ days: delta }).toISODate()
      ),
  };

  return (
    <BookingDateDebugDialog
      systemDate={systemDate}
      extendedDate={extendedDate}
    />
  );
};
