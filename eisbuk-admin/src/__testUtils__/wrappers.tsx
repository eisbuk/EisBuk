import React from "react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@material-ui/core";

import { currentTheme } from "@/themes";

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

// #region ThemeWrapper
/**
 * Wrapper used to wrap children with Material-UI `ThemeProvder`
 * and pass `currentTheme` from `@/themes.ts` as theme
 * @param param0 children
 * @returns children wrapped in `ThemeProvider`
 */
const ThemeWrapper: React.FC = ({ children }) => (
  <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>
);
/**
 * A custom render function wrapping passed ui with `ThemeWrapper` and rendering for tests.
 * @param ui we want to render for testing
 * @returns the result of `jest.render` function
 */
export const renderWithTheme = (ui: JSX.Element): ReturnType<typeof render> =>
  render(ui, { wrapper: ThemeWrapper });
// #endregion ThemeWrapper
