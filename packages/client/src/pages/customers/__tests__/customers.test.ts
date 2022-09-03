/**
 * @jest-environment node
 */

import { Category, Customer } from "@eisbuk/shared";
import { getNewSubscriptionNumber } from "../utils";

describe("`getNewSubscriptionNumber` function", () => {
  test("should return the string '1' when there are no customers", () => {
    const first = getNewSubscriptionNumber([]);
    expect(first).toEqual("1");
  });
  test("should return the string '2' if there is a customers with '1'", () => {
    const customers: Customer[] = [
      { ...CUSTOMER_COOKIECUTTER, subscriptionNumber: "1" },
    ];
    const first = getNewSubscriptionNumber(customers);
    expect(first).toEqual("2");
  });
  test("should return the string '10' if the largest number present is 9", () => {
    const customers: Customer[] = [
      { ...CUSTOMER_COOKIECUTTER, subscriptionNumber: "9" },
      { ...CUSTOMER_COOKIECUTTER, subscriptionNumber: "It's over 9000!" },
    ];
    const first = getNewSubscriptionNumber(customers);
    expect(first).toEqual("10");
  });
});

const CUSTOMER_COOKIECUTTER = {
  secretKey: "secretKey",
  id: "id",
  name: "name",
  surname: "surname",
  category: [Category.Competitive],
};
