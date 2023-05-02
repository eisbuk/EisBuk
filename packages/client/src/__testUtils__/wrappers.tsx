import React from "react";
import { Store } from "redux";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { render } from "@testing-library/react";
import { Formik, FormikConfig } from "formik";
import { Provider as ReduxProvider } from "react-redux";

import { getNewStore } from "@/store/createStore";

// #region RouterWrapper

/**
 * Function returne a router wrapper used for custom render function.
 * @param props Props to pass onto `MemoryRouter`
 * @returns a wrapper component accepting `children` as props and wrapping them in `MemoryRouter`
 */
const createRouterWrapper =
  (props?: MemoryRouterProps): React.FC =>
  ({ children }) =>
    <MemoryRouter {...props}>{children}</MemoryRouter>;
/**
 * Custom render function. We're using this to wrap
 * all of the tests with the memory router, in case component uses router hooks
 * and would otherwise break
 * @param ui we want to wrap with `MemoryRouter` and render for test
 * @param routerParams (optional) custom props passed to `MemoryRouter` component of the wrapper
 * @returns the result of `vi.render` function
 */
export const renderWithRouter = (
  ui: JSX.Element,
  routerParams?: MemoryRouterProps
): ReturnType<typeof render> =>
  render(ui, { wrapper: createRouterWrapper(routerParams) });

// #endregion RouterWrapper

// #region FormikWrapper

/** @DUPLICATE in @eisbuk/ui/src/utils/testUtils.tsx */
type PartialFormikProps = Partial<FormikConfig<Record<string, any>>>;

/**
 * Function returne a router wrapper used for custom render function.
 * @param props Props to pass onto `Formik` and `updateFormValues` function used to extract current form `values` state
 * @returns a wrapper component accepting `children` as props and wrapping them in `MemoryRouter`
 * @DUPLICATE in @eisbuk/ui/src/utils/testUtils.tsx
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
 * @returns the result of `vi.render` function
 * @DUPLICATE in @eisbuk/ui/src/utils/testUtils.tsx
 */
export const renderWithFormik = (
  ui: JSX.Element,
  formikParams?: PartialFormikProps
): ReturnType<typeof render> =>
  render(ui, {
    wrapper: createFormikWrapper(formikParams),
  });

// #endregion FormikWrapper

// #region renderWithRedux
export const renderWithRedux = (
  ui: JSX.Element,
  store: Store<any> = getNewStore()
): ReturnType<typeof render> =>
  render(ui, {
    wrapper: () => <ReduxProvider store={store}>{ui}</ReduxProvider>,
  });
// #endRegion renderWithRedux
