import React from "react";
import { ComponentMeta } from "@storybook/react";

import Table from "./Table";

export default {
  title: "Table",
  component: Table,
} as ComponentMeta<typeof Table>;

const testHeaders = {
  athlete: "Athlete",
  "2022-09-03": "Mon, 1st",
  "2022-09-04": "Tues, 2nd",
};

const testItems = [
  { athlete: "Chris", "2022-09-03": 1.5, "2022-09-04": 2.0 },
  { athlete: "Ivan", "2022-09-03": "-", "2022-09-04": 1.0 },
];

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <Table items={testItems} headers={testHeaders} />
  </>
);
