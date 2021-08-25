import React from "react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { render } from "@testing-library/react";

/**
 * A router wrapper used with custom render function.
 * @param param0 `{ children }`
 * @returns `children` wrapped with memory router
 */
const createRouterWrapper = (props?: MemoryRouterProps): React.FC => ({
  children,
}) => <MemoryRouter {...props}>{children}</MemoryRouter>;
/**
 * Custom render function. We're using this to wrap
 * all of the tests with the memory router, in case component uses router hooks
 * and would otherwise break
 * @param ui the same UI we want to render for test
 * @returns the result of render function
 */
export const renderWithRouter = (
  ui: JSX.Element,
  routerParams?: MemoryRouterProps
): ReturnType<typeof render> =>
  render(ui, { wrapper: createRouterWrapper(routerParams) });
