import React from "react";
import { describe, afterEach, test, expect, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import CustomerList from "../CustomerList";

import { saul, gus } from "@eisbuk/testing/customers";

const deletedGus = { ...gus, deleted: true };

const TestWithSearch = () => {
  const [filterString, setFilterString] = React.useState("");

  return (
    <>
      <input
        type="search"
        value={filterString}
        onChange={(e) => setFilterString(e.target.value)}
      />
      <CustomerList customers={[saul, gus]} filterString={filterString} />
    </>
  );
};

describe("CustomerList", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Smoke test", () => {
    test("should display existing customers, omitting the deleted ones", () => {
      render(<CustomerList customers={[saul, deletedGus]} />);
      screen.getByText(saul.name);
      expect(screen.queryByText(gus.name)).toBeNull();
    });
  });

  describe("Test search functionality", () => {
    const saulRegex = new RegExp(saul.name);
    const goodmanRegex = new RegExp(saul.surname);
    const gusRegex = new RegExp(gus.surname);

    beforeEach(() => {
      render(<TestWithSearch />);
    });

    test("should filter customers based on name string match", () => {
      const searchBar = screen.getByRole("searchbox");

      // check searching by name
      fireEvent.change(searchBar, { target: { value: saul.name } });
      // should show saul, but filter gus
      screen.getByText(goodmanRegex);
      expect(screen.queryByText(gusRegex)).toBeNull();
    });

    test("should filter customers based on surname string match", () => {
      const searchBar = screen.getByRole("searchbox");

      fireEvent.change(searchBar, {
        target: { value: gus.surname },
      });
      // should show gus, but filter saul
      screen.getByText(gusRegex);
      expect(screen.queryByText(saulRegex)).toBeNull();
    });

    test("should search case insensitively", () => {
      const searchBar = screen.getByRole("searchbox");

      fireEvent.change(searchBar, {
        target: { value: gus.surname.toUpperCase() },
      });
      // should show gus, but filter saul
      screen.getByText(gusRegex);
      expect(screen.queryByText(saulRegex)).toBeNull();
    });
  });
});
