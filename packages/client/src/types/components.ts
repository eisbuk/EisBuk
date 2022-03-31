import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { OverridableComponent } from "@mui/material/OverridableComponent";

import { Customer, SlotInterface } from "@eisbuk/shared";

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

// #region SlotOperationButtons

export interface SlotButtonProps {
  /**
   * Material-UI size prop.
   * Can be read from context or set explicitly for each button.
   * Explicitly set takes presedance over value from context,
   * if none provided fallsback to `medium`
   */
  size?: "small" | "medium";
}

// #endregion SlotOperationButtons

// #region attendanceCard
export interface CustomerWithAttendance extends Customer {
  bookedInterval: string | null;
  attendedInterval: string | null;
}
// #endregion attendanceCard

// #region bookingCard
export interface SlotWithBookedInterval extends SlotInterface {
  bookedInterval?: string | null;
}
// #endregion bookingCard
