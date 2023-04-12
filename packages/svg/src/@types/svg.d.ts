declare module "*.svg" {
  import { SVGComponent } from "../types";

  const Component: SVGComponent;

  export default Component;
}
