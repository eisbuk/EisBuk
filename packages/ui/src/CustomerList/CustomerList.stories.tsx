import React from "react";
import { ComponentMeta } from "@storybook/react";

import { CustomerFull } from "@eisbuk/shared";

import CustomerList from "./CustomerList";
import { SearchBar } from "../SearchBar";

import * as c from "@eisbuk/testing/customers";

export default {
  title: "Customer List",
  component: CustomerList,
} as ComponentMeta<typeof CustomerList>;

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
    <div className="mx-auto max-w-[720px] border-dotted border-2 border-gray-300">
      <SearchBar
        value={filterString}
        onChange={(e) => setFilterString(e.target.value)}
      />

      <CustomerList filterString={filterString} customers={customers} />
    </div>
  );
};
