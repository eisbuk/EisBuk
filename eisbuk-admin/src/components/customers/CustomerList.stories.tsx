import React from "react";
import { ComponentStory } from "@storybook/react";
import _ from "lodash";
import seedrandom from "seedrandom";
import { v4 as uuidv4 } from "uuid";

import { Category, Customer, FIRST_NAMES, LAST_NAMES } from "eisbuk-shared";

import CustomerList from "@/components/customers/CustomerList";
import { DateTime } from "luxon";

export default {
  title: "Customer list",
  component: CustomerList,
  argTypes: {
    onDeleteCustomer: { action: "deleted" },
    updateCustomer: { action: "modified" },
  },
};

// ***** Region Setup ***** //
// We're using this seed to get pseudo-random results
// but to keep them consistent across builds (commits) for chromatic diff
const PRNG = seedrandom("foobar");

// Alter Math.random to refer to seedrandom's PRNG. */
Math.random = PRNG;

// Assign a new Lodash context to a separate variable AFTER altering Math.random. */
const lodash = _.runInContext();

const CATEGORIES = lodash.omit(
  Object.values(Category),
  Category.Adults
) as Category[];

/**
 * Create a dummy user for storybook show
 * @returns random customer
 */
const createDemoCustomer = (): Partial<Customer> => {
  const name = lodash.sample(FIRST_NAMES)!;
  const surname = lodash.sample(LAST_NAMES)!;
  return {
    name,
    surname,
    email: lodash
      .deburr(`${name}.${surname}@example.com`.toLowerCase())
      .replace(" ", "."),
    id: uuidv4(),
    category: lodash.sample(CATEGORIES)!,
    covidCertificateSuspended: lodash.sample([true, false]),
    covidCertificateReleaseDate: DateTime.local()
      .plus({ days: _.random(-500, 0) })
      .toISODate(),
    certificateExpiration: DateTime.local()
      .plus({ days: _.random(-40, 200) })
      .toISODate(),
  };
};

const Template: ComponentStory<typeof CustomerList> = (
  args: Omit<Parameters<typeof CustomerList>[0], "open">
) => <CustomerList {...args} />;

const dummyCustomers = Array(100)
  .fill(null)
  .map(() => createDemoCustomer()) as Customer[];
// ***** End Region Setup ***** //

// ***** Region Stories ***** //
export const Empty = Template.bind({});
Empty.args = { customers: [] };

export const ACouple = Template.bind({});
ACouple.args = { customers: dummyCustomers.slice(0, 2) };

export const Ten = Template.bind({});
Ten.args = { customers: dummyCustomers.slice(0, 10) };

export const AHundred = Template.bind({});
AHundred.args = { customers: dummyCustomers };
// ***** End Region Stories ***** //
