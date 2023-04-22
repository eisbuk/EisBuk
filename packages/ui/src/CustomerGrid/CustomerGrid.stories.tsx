import React from "react";
import { ComponentMeta } from "@storybook/react";

import { CustomerFull } from "@eisbuk/shared";

import CustomerGrid from "./CustomerGrid";
import { SearchBar } from "../SearchBar";

import * as c from "@eisbuk/test-data/customers";

export default {
  title: "Customer Grid",
  component: CustomerGrid,
} as ComponentMeta<typeof CustomerGrid>;

const customers: CustomerFull[] = Object.values({
  ...c,
  greg: {
    ...c.saul,
    id: "greg",
    name: "Grzegorz",
    surname: "Brzęczyszczykiewicz",
    photoURL:
      "https://avatars.akamai.steamstatic.com/3f8169f3268ec0601dc642ab94eb8cbed57ab66e_full.jpg",
  },
});

export const Default = (): JSX.Element => {
  const [filterString, setFilterString] = React.useState("");

  return (
    <>
      <SearchBar
        value={filterString}
        onChange={(e) => setFilterString(e.target.value)}
      />

      <CustomerGrid customers={customers} filterString={filterString} />
    </>
  );
};
