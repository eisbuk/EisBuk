import React, { useEffect } from "react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { render } from "@testing-library/react";
import { Formik, FormikConfig } from "formik";

// #region RouterWrapper

/**
 * Function returne a router wrapper used for custom render function.
 * @param props Props to pass onto `MemoryRouter`
 * @returns a wrapper component accepting `children` as props and wrapping them in `MemoryRouter`
 */
const createRouterWrapper = (props?: MemoryRouterProps): React.FC => ({
  children,
}) => <MemoryRouter {...props}>{children}</MemoryRouter>;
/**
 * Custom render function. We're using this to wrap
 * all of the tests with the memory router, in case component uses router hooks
 * and would otherwise break
 * @param ui we want to wrap with `MemoryRouter` and render for test
 * @param routerParams (optional) custom props passed to `MemoryRouter` component of the wrapper
 * @returns the result of `jest.render` function
 */
export const renderWithRouter = (
  ui: JSX.Element,
  routerParams?: MemoryRouterProps
): ReturnType<typeof render> =>
  render(ui, { wrapper: createRouterWrapper(routerParams) });

// #endregion RouterWrapper

// #region FormikWrapper

type PartialFormikProps = Partial<FormikConfig<Record<string, any>>>;

/**
 * Function returne a router wrapper used for custom render function.
 * @param props Props to pass onto `Formik` and `updateFormValues` function used to extract current form `values` state
 * @returns a wrapper component accepting `children` as props and wrapping them in `MemoryRouter`
 */
const createFormikWrapper = ({
  formValuesHOF,
  ...props
}: PartialFormikProps & {
  formValuesHOF: (values: Record<string, any>) => void;
}): React.FC => ({ children }) => {
  // fallback props in case of not being provided from parent fuction props
  const fallbackProps = {
    onSubmit: () => {},
    initialValues: {},
  };

  return (
    <Formik {...fallbackProps} {...props}>
      {({ values }) => {
        useEffect(() => {
          formValuesHOF(values);
        }, [values]);

        return children;
      }}
    </Formik>
  );
};
/**
 * Custom render function. We're using this to wrap
 * all of the tests with the memory router, in case component uses router hooks
 * and would otherwise break
 * @param ui we want to wrap with `MemoryRouter` and render for test
 * @param routerParams (optional) custom props passed to `MemoryRouter` component of the wrapper
 * @returns the result of `jest.render` function
 */
export const renderWithFormik = (
  ui: JSX.Element,
  formikParams?: PartialFormikProps
): { getFormValues: () => Record<string, any> } => {
  let getFormValues: () => Record<string, any> = () => ({});
  const formValuesHOF = (values: Record<string, any>) => {
    getFormValues = () => values;
  };
  render(ui, {
    wrapper: createFormikWrapper({ ...formikParams, formValuesHOF }),
  });
  return { getFormValues };
};
// #endregion FormikWrapper
