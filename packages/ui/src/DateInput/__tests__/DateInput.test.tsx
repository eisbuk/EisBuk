import { vi, beforeEach, afterEach, expect, test, describe } from "vitest";
import React from "react";
import { screen, render, waitFor, cleanup } from "@testing-library/react";
import { Formik, Field, FormikValues, Form } from "formik";
import userEvent from "@testing-library/user-event";

import DateInput from "../DateInput";

const mockSubmit = vi.fn();

const testFieldName = "test";

const TestForm = ({ initialValues }: FormikValues) => (
  <Formik initialValues={initialValues} onSubmit={mockSubmit}>
    <Form>
      <Field component={DateInput} name={testFieldName} label="Test Field" />
      <button type="submit">Submit</button>
    </Form>
  </Formik>
);

describe("Date Input", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  beforeEach(() => {
    render(<TestForm initialValues={{ test: "" }} />);
  });

  test("should parse european date into ISOString", async () => {
    // Type in the european date
    userEvent.type(screen.getByRole("textbox"), "1/12/2021");

    // Submitting the form by clicking the button should submit it with the value
    // for "test" field having been transformed to a valid ISO date string
    userEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        { test: "2021-12-01" },
        expect.objectContaining({})
      );
    });
  });

  test("should parse european date (with . or - ) into ISO string", async () => {
    const input = screen.getByRole("textbox");

    // Check for dash separated input
    userEvent.type(input, "1-12-2021");
    userEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        { test: "2021-12-01" },
        expect.objectContaining({})
      );
    });

    // Check for dot separated input
    userEvent.clear(input);
    userEvent.type(input, "1.12.2021");
    userEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveProperty("value", "01/12/2021");
      expect(mockSubmit).toHaveBeenCalledWith(
        { test: "2021-12-01" },
        expect.objectContaining({})
      );
    });
  });

  test("should parse ISOString 'value' into slash separated european date", async () => {
    // Remove the form rendered in 'beforeEach'
    cleanup();
    render(<TestForm initialValues={{ test: "2021-12-01" }} />);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveProperty("value", "01/12/2021");
    });
  });

  // This is a weird edge case and didn't work out of the box:
  // When a user clicks a "submit" button, the latest form element is blurred
  // (and in this case the date parsed into a valid ISO string). on button press, however,
  // if an instance of DateInput was focused, and a form submitted using "Enter" button press,
  // the element wouldn't be blurred and the form would get submitted with stale/unparsed value.
  // Here we're testing a fix of this bug.
  test('should blur + submit on "Enter" button press', async () => {
    // Type in the european date
    userEvent.type(screen.getByRole("textbox"), "1/12/2021");

    // Submitting the form by clicking the button should submit it with the value
    // for "test" field having been transformed to a valid ISO date string
    userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        { test: "2021-12-01" },
        expect.objectContaining({})
      );
    });
  });
});
