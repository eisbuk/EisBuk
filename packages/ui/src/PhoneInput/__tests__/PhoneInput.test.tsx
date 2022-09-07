import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, Form, Formik, FormikConfig } from "formik";

import PhoneInput from "../PhoneInput";

interface PhoneInputTest {
  name: string;
  initialValue: string;
  defaultCountry?: string;
  testAction: () => void;
  wantValue: string;
}

const runPhoneInputTableTests = (tests: PhoneInputTest[]) =>
  tests.forEach(
    ({ name, initialValue, defaultCountry, testAction, wantValue }) => {
      // We only care about the submit values for this test case
      const mockSubmit = jest.fn();
      const handleSubmit: FormikConfig<{ phone: string }>["onSubmit"] = (
        values
      ) => mockSubmit(values);

      test(name, async () => {
        // Setup test
        render(
          <Formik
            initialValues={{ phone: initialValue }}
            onSubmit={handleSubmit}
          >
            <Form>
              <Field
                name="phone"
                component={PhoneInput}
                defaultCountry={defaultCountry}
              />
              <button type="submit">Submit</button>
            </Form>
          </Formik>
        );

        // Run test action
        testAction();

        // Check results
        screen.getByRole("button").click();
        await waitFor(() => {
          expect(mockSubmit).toHaveBeenCalledWith({ phone: wantValue });
        });
      });
    }
  );

describe("PhoneInput", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  runPhoneInputTableTests([
    {
      name: "should prepend phone input with the selected country dial code",
      initialValue: "",
      testAction: () => {
        // Select 'HR', Croatia, dial code: "+385"
        userEvent.selectOptions(
          screen.getByRole("combobox"),
          screen.getByRole("option", { name: "HR (+385)" })
        );

        // Type in a generic phone number (we're expecting this to be prepended with "+385")
        userEvent.type(screen.getByRole("textbox"), "991234567");
      },
      wantValue: "+385991234567",
    },

    {
      name: "should update the value on dial code change",
      initialValue: "+385991234567",
      defaultCountry: "HR",
      testAction: () => {
        // Switch country from 'HR', to 'IT' (dial code: "+39") without providing input to text field
        userEvent.selectOptions(
          screen.getByRole("combobox"),
          screen.getByRole("option", { name: "IT (+39)" })
        );
      },
      wantValue: "+39991234567",
    },

    {
      name: "should not update the value on code change if there's no 'textValue'",
      initialValue: "",
      defaultCountry: "HR",
      testAction: () => {
        // Switch country from 'HR', to 'IT' (dial code: "+39") without providing input to text field
        userEvent.selectOptions(
          screen.getByRole("combobox"),
          screen.getByRole("option", { name: "IT (+39)" })
        );
      },
      // The value should be unchanged as there's no value for phone number aside from country code
      wantValue: "",
    },

    {
      name: "if initialised with the value, should infer the country code from the value",
      initialValue: "+385991234567",
      defaultCountry: "IT",
      testAction: () => {
        const textField = screen.getByRole("textbox");
        userEvent.clear(textField);
        userEvent.type(textField, "991111111");
      },
      // Even though IT is set as 'defaultValue' for dial code, the field already had a 'HR' prefixed number
      // and should stay so if not manually changed
      wantValue: "+385991111111",
    },
  ]);
});
