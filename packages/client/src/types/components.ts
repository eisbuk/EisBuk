import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { OverridableComponent } from "@mui/material/OverridableComponent";

import { SlotInterface } from "@eisbuk/shared";

// #region svg

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

// #endregion svg

// #region bookingCard
export interface SlotWithBookedInterval extends SlotInterface {
  bookedInterval?: string | null;
}
// #endregion bookingCard
