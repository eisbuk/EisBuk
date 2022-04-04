declare module "*.svg" {
  import * as React from "react";

  const source: string;
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  export default source;
}
