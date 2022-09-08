import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, Field, Formik, FormikConfig } from "formik";

import CountryCodesDropdown, {
  FormikComponent as CountryCodesDropdownFormik,
} from "../CountryCodesDropdown";

describe("CountryCodesDropdown", () => {
  test("should call 'onChange' with country's dial code, on select", () => {
    const mockOnChange = jest.fn();
    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
      mockOnChange(e.target.value);

    render(<CountryCodesDropdown label="countries" onChange={onChange} />);

    userEvent.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "IT (+39)" })
    );

    expect(mockOnChange).toHaveBeenCalledWith("+39");
  });

  test("should integrate seamlessly with Formik, through formik Field", async () => {
    const mockSubmit = jest.fn();
    const onSubmit: FormikConfig<{ countryCode: string }>["onSubmit"] = (
      values
    ) => mockSubmit(values);

    render(
      <Formik initialValues={{ countryCode: "+385" }} onSubmit={onSubmit}>
        <Form>
          <Field component={CountryCodesDropdownFormik} name="countryCode" />
          <button type="submit" />
        </Form>
      </Formik>
    );

    const submit = screen.getByRole("button");

    submit.click();
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({ countryCode: "+385" });
    });

    userEvent.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "IT (+39)" })
    );

    submit.click();
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({ countryCode: "+39" });
    });
  });
});
