import { SlotType } from "eisbuk-shared";

import { organizationInfo } from "@/themes";

const { theme } = organizationInfo;

/**
 * We're using standardized (but different) colors for "ice" and "off-ice"
 * slots. This is a convenience method to easily get the appropriate color
 * @param type slot tyoe
 * @returns color string
 */
export const getColorForSlotType = (type: SlotType): string =>
  type === SlotType.Ice
    ? theme.palette.ice.toString()
    : theme.palette.offIce.toString();
