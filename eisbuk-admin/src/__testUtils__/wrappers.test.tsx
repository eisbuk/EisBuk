import React from "react";
import { useField } from "formik";
import { screen } from "@testing-library/react";

import { renderWithFormik } from "./wrappers";
import userEvent from "@testing-library/user-event";

const previewId = "formik-value-preview-id";
const FormikTestComponent: React.FC<{ name: string }> = ({ name }) => {
  const [{ value }, , { setValue }] = useField(name);

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <pre data-testid={previewId}>{value}</pre>
    </>
  );
};

describe("Test Utils -> Wrappers ->", () => {
  describe("renderWithFormik ->", () => {
    test("Smoke test: FormikTestComponent should update form value 'onChange' and preview value on screen", () => {
      renderWithFormik(<FormikTestComponent name="testInput" />, {
        initialValues: { testInput: "test-initial" },
      });
      const valuePreview = screen.getByTestId(previewId);
      expect(valuePreview.innerHTML).toEqual("test-initial");
      const textInput = screen.getByRole("textbox");
      userEvent.type(textInput, "new-input");
      expect(valuePreview.innerHTML).toEqual("new-input");
    });

    test("should return formValues: current form value (even after updates)", () => {
      const { getFormValues } = renderWithFormik(
        <FormikTestComponent name="testInput" />,
        {
          initialValues: { testInput: "test-initial" },
        }
      );
      expect(getFormValues()).toEqual({ testInput: "test-initial" });
      const textInput = screen.getByRole("textbox");
      userEvent.type(textInput, "new-text");
      const preview = screen.getByTestId(previewId).innerHTML;
      expect(getFormValues()).toEqual({ testInput: preview });
    });
  });
});
