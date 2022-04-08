import { CSSProperties } from "react";

import { currentTheme } from "@/themes";

type Theme = typeof currentTheme;

interface MakeStylesCallback {
  (theme: Theme): Record<string, CSSProperties>;
}

interface UseStylesHook {
  (): Record<string, string>;
}

interface MakeStyles {
  (cb: MakeStylesCallback): UseStylesHook;
}

const makeStyles: MakeStyles = (callback) => {
  // eslint-disable-next-line callback-return
  const cssProperties = callback(currentTheme);

  const classNames = Object.keys(cssProperties);

  const useStyles: UseStylesHook = () =>
    classNames.reduce(
      (acc, className) => ({ ...acc, [className]: className }),
      {}
    );

  return useStyles;
};

export default makeStyles;
