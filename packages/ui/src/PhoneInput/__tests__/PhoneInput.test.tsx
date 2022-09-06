import { render } from "@testing-library/react";
import { Field, Formik } from "formik";
import React from "react";

import PhoneInput from "../PhoneInput";

describe("PhoneInput", () => {
  test("somke test", () => {
    render(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <Field name="phone" component={PhoneInput} />
      </Formik>
    );
  });
});
