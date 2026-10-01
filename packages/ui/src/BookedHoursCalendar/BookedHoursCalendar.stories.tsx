import React from "react";
import { ComponentMeta } from "@storybook/react";

import BookedHoursCalendar from "./BookedHoursCalendar";

import {
  buildSummary,
  octoberSummary,
  octoberSummaryWithExcluded,
} from "./__testData__";

export default {
  title: "Booked Hours Calendar",
  component: BookedHoursCalendar,
} as ComponentMeta<typeof BookedHoursCalendar>;

export const Default = (): JSX.Element => (
  <BookedHoursCalendar summary={octoberSummary} />
);

export const CancellationDisabled = (): JSX.Element => (
  <BookedHoursCalendar summary={octoberSummary} disabled />
);

export const WithExcludedBookings = (): JSX.Element => (
  <BookedHoursCalendar summary={octoberSummaryWithExcluded} />
);

export const EmptyMonth = (): JSX.Element => (
  <BookedHoursCalendar summary={buildSummary("2026-11", [])} />
);
