import React from "react";
import { ComponentStory } from "@storybook/react";
import _ from "lodash";
import seedrandom from "seedrandom";
import { v4 as uuidv4 } from "uuid";

import CustomerList from "@/components/customers/CustomerList";

import { Category } from "@/enums/firestore";

import { Customer } from "@/types/firestore";

import firstNames from "@/data/italian-names.json";
import lastNames from "@/data/italian-surnames.json";

export default {
  title: "Customer list",
  component: CustomerList,
  argTypes: {
    onDeleteCustomer: { action: "deleted" },
    updateCustomer: { action: "modified" },
  },
};

/***** Region Setup *****/
const PRNG = seedrandom("foobar");

/** @Ivan : I know the principle of seed from Go, but it seems unnecessary here */
/* Alter Math.random to refer to seedrandom's PRNG. */
Math.random = PRNG;

/* Assign a new Lodash context to a separate variable AFTER altering Math.random. */
const lodash = _.runInContext();

const CATEGORIES = lodash.omit(
  Object.values(Category),
  Category.Adulti
) as Category[];

/**
 * Create a dummy user for storybook show
 * @returns random customer
 */
const createDemoCustomer = () => {
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
};

const Template: ComponentStory<typeof CustomerList> = (
  args: Omit<Parameters<typeof CustomerList>[0], "open">
) => <CustomerList {...args} />;

const dummyCustomers = Array(100)
  .fill(null)
  .map(() => createDemoCustomer()) as Customer[];
/***** End Region Setup *****/

/***** Region Stories *****/
export const Empty = Template.bind({});
Empty.args = { customers: [] };

export const ACouple = Template.bind({});
ACouple.args = { customers: dummyCustomers.slice(0, 2) };

export const Ten = Template.bind({});
Ten.args = { customers: dummyCustomers.slice(0, 10) };

export const AHundred = Template.bind({});
AHundred.args = { customers: dummyCustomers };
/***** End Region Stories *****/
