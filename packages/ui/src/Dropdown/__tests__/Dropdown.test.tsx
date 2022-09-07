import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, Form, Formik, FormikConfig } from "formik";

import { FormikComponent as Dropdown } from "../Dropdown";

describe("Dropdown", () => {
  describe("FormikField", () => {
    test("should integrate with Formik seamlessly", async () => {
      const mockSubmit = jest.fn();
      const handleSubmit: FormikConfig<{ dropdown: string }>["onSubmit"] = (
        values
      ) => mockSubmit(values);

      render(
        <Formik initialValues={{ dropdown: "IT" }} onSubmit={handleSubmit}>
          <Form>
            <Field
              component={Dropdown}
              name="dropdown"
              options={["HR", "IT", "FR"]}
            />
            <button type="submit" />
          </Form>
        </Formik>
      );

      const submit = screen.getByRole("button");

      submit.click();
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ dropdown: "IT" });
      });

      userEvent.selectOptions(
        screen.getByRole("combobox"),
        screen.getByRole("option", { name: "HR" })
      );

      submit.click();
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ dropdown: "HR" });
      });
    });
  });
});
