import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, Form, Formik, FormikConfig } from "formik";

import PhoneInput from "../PhoneInput";

describe("PhoneInput", () => {
  test("should prepend phone input with the selected country dial code", async () => {
    // We only care about the submit valules for this test case
    const mockSubmit = jest.fn();
    const handleSubmit: FormikConfig<{ phone: string }>["onSubmit"] = (
      values
    ) => mockSubmit(values);

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
});
