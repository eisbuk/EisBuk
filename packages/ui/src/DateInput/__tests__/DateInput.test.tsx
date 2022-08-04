/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, fireEvent, render } from "@testing-library/react";
import { Formik, Field, FieldProps, FormikValues } from "formik";

import DateInput from "../DateInput";

const setFieldSpy = jest.fn();

const testFieldName = "test";

const Form = ({ initialValues }: FormikValues) => (
  <Formik initialValues={initialValues} onSubmit={() => {}}>
    <Field name={testFieldName}>
      {({ field, form, meta }: FieldProps) => (
        <DateInput
          formikField={{
            field,
            form: {
              ...form,
              setFieldValue: setFieldSpy,
            },
            meta,
          }}
          label="Test Field"
        />
      )}
    </Field>
  </Formik>
);

describe("Date Input", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("smoke test", () => {
    test("should render date input", () => {
      render(<Form initialValues={{ test: "" }} />);
      screen.getByRole("textbox");
    });
  });

  describe("Test updating of the string", () => {
    beforeEach(() => {
      render(<Form initialValues={{ test: "" }} />);
    });

    test("should call 'setFieldValue' on user input", () => {
      const testInput = "test";

      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: testInput },
      });

      expect(setFieldSpy).toHaveBeenCalledWith(testFieldName, testInput, true);
    });

    test("should parse european date into ISOString", () => {
      const testInput = "01/12/2021";
      const isoDate = "2021-12-01";

      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: testInput },
      });

      expect(setFieldSpy).toHaveBeenCalledWith(testFieldName, isoDate, true);
    });

    test("should parse european date into ISOString with . or -", () => {
      const dashInput = "01-12-2021";
      const dotInput = "01.12.2021";
      const isoDate = "2021-12-01";

      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dashInput },
      });

      expect(setFieldSpy).toHaveBeenCalledWith(testFieldName, isoDate, true);

      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dotInput },
      });

      expect(setFieldSpy).toHaveBeenCalledWith(testFieldName, isoDate, true);
    });

    test("should parse european date with single digits into ISOString with . or -", () => {
      const dashInput = "1-12-2021";
      const dotInput = "1.12.2021";
      const isoDate = "2021-12-01";

      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dashInput },
      });

      expect(setFieldSpy).toHaveBeenCalledWith(testFieldName, isoDate, true);

      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dotInput },
      });

      expect(setFieldSpy).toHaveBeenCalledWith(testFieldName, isoDate, true);
    });

    describe("Test processing of received value", () => {
      test("should parse ISOString 'value' into slash separated european date", () => {
        const testInput = "2021-12-01";
        const slashSeparated = "01/12/2021";

        render(<Form initialValues={{ test: testInput }} />);

        screen.getByDisplayValue(slashSeparated);
      });
    });
  });
});
