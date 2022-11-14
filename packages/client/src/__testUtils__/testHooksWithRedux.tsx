import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Store } from "redux";
import { render } from "@testing-library/react";

/**
 * A test util used to test hooks controlling the behavior through redux hooks.
 * @param store an initalized redux store
 * @param hook a hook we're testing
 * @param args args for the hook (if any)
 */
export const testHookWithRedux = <
  S,
  H extends (...args: any[]) => any,
  P extends Parameters<H>,
  R extends ReturnType<H>,
  RO extends { updateProps: (...args: P) => void; result: R }
>(
  store: Store<S>,
  hook: H,
  ...args: P
): RO => {
  const returnObj = {} as RO;

  /**
   * A test component we're using to host the hook.
   * @param {string} props.hookArgs args to pass to the hook.
   */
  const HookTestComponent: React.FC<{ hookArgs: Parameters<H> }> = ({
    hookArgs,
  }) => {
    const r = hook(...hookArgs);

    // Update the return object with result
    // each time a hook result changes
    useEffect(() => {
      returnObj.result = r;
    }, [r]);

    return null;
  };

  // first render of the hook pass the initial `args` as `hookArgs`
  const { rerender } = render(
    <Provider store={store}>
      <HookTestComponent {...{ hookArgs: args }} />
    </Provider>
  );

  /**
   * Runs `rerender` with `newArgs` passed as `hookArgs` to simulate updating
   * of the props on a mounted hook
   */
  const updateProps = (...newArgs: P) =>
    rerender(
      <Provider store={store}>
        <HookTestComponent {...{ hookArgs: newArgs }} />
      </Provider>
    );

  returnObj.updateProps = updateProps;

  return returnObj;
};
