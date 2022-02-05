import React from "react";
import { DateTime } from "luxon";
import i18n from "@/i18next/i18n";

import { BookingCountdown } from "@/enums/translations";

import Button from "@material-ui/core/Button";

import Countdown from "./Countdown";

export default {
  title: "Countdown",
  component: Countdown,
};

const countdownDate = DateTime.now().plus({ days: 2 });

const title = "Countdown";
const message = i18n.t(BookingCountdown.FirstDeadline, {
  deadline: countdownDate,
});

export const Default = (): JSX.Element => (
  <Countdown {...{ title, message, countdownDate }} />
);

export const NoTitle = (): JSX.Element => (
  <Countdown {...{ message, countdownDate }} />
);

export const WildStyles = (): JSX.Element => (
  <Countdown
    {...{
      title,
      message,
      countdownDate,
      textColor: "rgba(130, 255, 130, 0.9)",
      countdownColor: "yellow",
      backgroundColor: "magenta",
    }}
  />
);

export const WithButton = (): JSX.Element => (
  <Countdown
    {...{
      title,
      message,
      countdownDate,
      actionButton: (
        <Button
          variant="contained"
          onClick={() => {
            console.log("Ready for action");
          }}
        >
          Action
        </Button>
      ),
    }}
  />
);
