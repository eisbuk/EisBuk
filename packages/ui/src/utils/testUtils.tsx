import React from "react";
import { Formik, FormikConfig } from "formik";
import { render } from "@testing-library/react";

/** @DUPLICATE in @eisbuk/client/src/__testUtils/wrappers.ts */
type PartialFormikProps = Partial<FormikConfig<Record<string, any>>>;

/**
 * Function returne a router wrapper used for custom render function.
 * @param props Props to pass onto `Formik` and `updateFormValues` function used to extract current form `values` state
 * @returns a wrapper component accepting `children` as props and wrapping them in `MemoryRouter`
 * @DUPLICATE in @eisbuk/client/src/__testUtils/wrappers.ts
 */
const createFormikWrapper =
  (props?: PartialFormikProps): React.FC =>
  ({ children }) => {
    // fallback props in case of not being provided from parent fuction props
    const fallbackProps = {
      onSubmit: () => {},
      initialValues: {},
    };

    return (
      <Formik {...fallbackProps} {...props}>
        {children}
      </Formik>
    );
  };
/**
 * Custom render function. We're using this to wrap
 * all of the tests with Formik context
 * @param ui we want to wrap with `Formik` and render for test
 * @param routerParams (optional) custom props passed to `Formik` component of the wrapper
 * @returns the result of `jest.render` function
 * @DUPLICATE in @eisbuk/client/src/__testUtils/wrappers.ts
 */
export const renderWithFormik = (
  ui: JSX.Element,
  formikParams?: PartialFormikProps
): ReturnType<typeof render> =>
  render(ui, {
    wrapper: createFormikWrapper(formikParams),
  });
