import { SvgIconTypeMap } from "@material-ui/core/SvgIcon";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";

/**
 * Type alias for props of MUI SVG-as-JSX component
 */
export type SvgProps = Parameters<
  OverridableComponent<SvgIconTypeMap<unknown, "svg">>
>[0];

/**
 * Type alias for MUI SVG-as-JSX component
 */
export type SvgComponent = OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
