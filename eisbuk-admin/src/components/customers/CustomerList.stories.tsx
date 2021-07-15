import React from "react";
import CustomerList from "./CustomerList";
import _ from "lodash";
import seedrandom from "seedrandom";
import { v4 as uuidv4 } from "uuid";

import { Category } from "@/enums/firestore";

import firstNames from "@/data/italian-names.json";
import lastNames from "@/data/italian-surnames.json";

const PRNG = seedrandom("foobar");

/* Alter Math.random to refer to seedrandom's PRNG. */
/** @Ivan : I know the principle of seed from Go, but it seems unnecessary here */
Math.random = PRNG;

/* Assign a new Lodash context to a separate variable AFTER altering Math.random. */
const lodash = _.runInContext();

const CATEGORIES = lodash.omit(Object.values(Category), Category.Adulti);

/**
 * Create a dummy user for storybook show
 * @returns
 */
function createDemoCustomer() {
  const name = lodash.sample(firstNames);
  const surname = lodash.sample(lastNames);
  return {
    name,
    surname,
    email: lodash
      .deburr(`${name}.${surname}@example.com`.toLowerCase())
      .replace(" ", "."),
    id: uuidv4(),
    category: lodash.sample(CATEGORIES),
  };
}

export default {
  title: "Customer list",
  component: CustomerList,
};

const baseProps = {
  open: true,
};

const dummyCustomers = Array(100).fill(createDemoCustomer());

export const Empty = (): JSX.Element => (
  <CustomerList {...baseProps} customers={[]} />
);

export const ACouple = (): JSX.Element => (
  <CustomerList {...baseProps} customers={dummyCustomers.slice(0, 2)} />
);

export const Ten = (): JSX.Element => (
  <CustomerList {...baseProps} customers={dummyCustomers.slice(0, 10)} />
);

export const AHundred = (): JSX.Element => (
  <CustomerList {...baseProps} customers={dummyCustomers} />
);

/** @TODO create the entry below when solving onDeleteCustomer and onEditCustomer  */
// export const TenWithEdit = Template.bind({});
// TenWithEdit.args = { customers: _.range(10).map(createDemoCustomer) };
// TenWithEdit.argTypes = {
//   onDeleteCustomer: { action: "deleted" },
//   onEditCustomer: { action: "modified" },
// };
