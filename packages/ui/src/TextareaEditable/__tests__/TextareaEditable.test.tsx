import React, { useEffect, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, FormikConfig, Field, Form } from "formik";

import TextareaEditable from "../TextareaEditable";

describe("TextareaEditable", () => {
  describe("Test edit functionality", () => {
    test("should display 'value' as paragraph if 'isEditing' falsy", () => {
      render(<TextareaEditable value="test-text" />);
      screen.getByText("test-text");
      expect(screen.queryByRole("textbox")).toBeFalsy();
    });

    test("should display the 'value' passed in and call 'onChange' with each value update", () => {
      // We'll be using this value to lift the internal value of the test component
      // updated by user interaction with Textarea
      let testValue = "test-value";

      // This component is used to allow for stateful updates (useState) triggered by
      // the 'Textarea' component
      const TestComponent = () => {
        const [internalValue, setInternalValue] = useState(testValue);
        // Each time internal value changes, lift it to 'testValue' variable so that we can
        // run assertions against it
        useEffect(() => {
          testValue = internalValue;
        }, [internalValue]);

        const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setInternalValue(e.target.value);
        };
        return (
          <TextareaEditable
            value={internalValue}
            onChange={onChange}
            isEditing
          />
        );
      };
      render(<TestComponent />);

      // Assert the initial value has been rendered to the screen
      screen.getByText("test-value");

      const textarea = screen.getByRole("textbox");

      userEvent.clear(textarea);
      userEvent.type(textarea, "test-input");

      expect(testValue).toEqual("test-input");
    });
  });

  describe("Test with Formik", () => {
    test("should integrate with Formik seamlessly", async () => {
      const initialValues = { foo: "initial-input" };

      // Create this function logic to call onSubmit with only the values (relevant for testing)
      // without additional formik helpers
      const mockSubmit = jest.fn();
      const onSubmit: FormikConfig<typeof initialValues>["onSubmit"] = (
        values
      ) => mockSubmit(values);

      render(
        <Formik {...{ initialValues, onSubmit }}>
          <Form>
            <Field component={TextareaEditable} name="foo" isEditing />
            <button type="submit" />
          </Form>
        </Formik>
      );

      screen.getByText("initial-input");

      const textarea = screen.getByRole("textbox");
      const submitButton = screen.getByRole("button");

      userEvent.clear(textarea);
      userEvent.type(textarea, "test-input");
      submitButton.click();

      await waitFor(() =>
        expect(mockSubmit).toHaveBeenCalledWith({ foo: "test-input" })
      );
    });
  });
});
