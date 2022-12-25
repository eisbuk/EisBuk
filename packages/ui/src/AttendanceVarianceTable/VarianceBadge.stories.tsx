import React from "react";
import { ComponentMeta } from "@storybook/react";

import VarianceBadge from "./VarianceBadge";
import { TableCell } from "../Table";

export default {
  title: "Attendance Variance Badge",
  component: VarianceBadge,
} as ComponentMeta<typeof VarianceBadge>;

const variance = [0, 0.5, -0.5, 1, -1, 2, -2];

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <table className="">
      <tbody>
        <tr>
          {variance.map((v) => (
            <TableCell key={v}>
              <VarianceBadge delta={v} />
            </TableCell>
          ))}
        </tr>
      </tbody>
    </table>
  </>
);
