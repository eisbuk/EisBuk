import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, Form, Formik, FormikConfig } from "formik";

import PhoneInput from "../PhoneInput";

describe("PhoneInput", () => {
  // We only care about the submit valules for this test case
  const mockSubmit = jest.fn();
  const handleSubmit: FormikConfig<{ phone: string }>["onSubmit"] = (values) =>
    mockSubmit(values);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should prepend phone input with the selected country dial code", async () => {
    render(
      <Formik initialValues={{ phone: "" }} onSubmit={handleSubmit}>
        <Form>
          <Field name="phone" component={PhoneInput} />
          <button type="submit">Submit</button>
        </Form>
      </Formik>
    );

    // Select 'HR', Croatia, dial code: "+385"
    userEvent.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "HR" })
    );

    // Type in a generic phone number (we're expecting this to be prepended with "+385")
    userEvent.type(screen.getByRole("textbox"), "991234567");

    screen.getByRole("button").click();
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({ phone: "+385991234567" });
    });
  });

  test("should update the value on dial code change", async () => {
    render(
      <Formik
        initialValues={{ phone: "+385991234567" }}
        onSubmit={handleSubmit}
      >
        <Form>
          <Field name="phone" component={PhoneInput} defaultCountry="HR" />
          <button type="submit">Submit</button>
        </Form>
      </Formik>
    );

    // Switch country from 'HR', to 'IT' (dial code: "+39") without providing input to text field
    userEvent.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "IT" })
    );

    screen.getByRole("button").click();
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({ phone: "+39991234567" });
    });
  });
});
