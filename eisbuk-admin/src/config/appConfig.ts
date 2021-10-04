import _ from "lodash";

import { SlotType, Category } from "eisbuk-shared";
import { DeprecatedDuration } from "eisbuk-shared/dist/enums/deprecated/firestore";

import { ProjectIcons } from "@/enums/components";

interface DurationEntry {
  id: DeprecatedDuration;
  label: string;
  minutes: number;
}

interface CategoryEntry {
  id: Category;
  label: string;
}

interface SlotTypeEntry {
  id: SlotType;
  label: string;
  color: "primary" | "secondary";
  icon: ProjectIcons;
}

export interface SlotsLabelList {
  durations: DurationEntry[];
  categories: CategoryEntry[];
  types: SlotTypeEntry[];
}

// These definition drive the UI.
// We define them as arrays to be able to specify an order
/** @TODO rewrite these to use map or string enums (if possible) */
export const slotsLabelsLists: SlotsLabelList = {
  durations: [
    { id: DeprecatedDuration["1h"], label: "1H", minutes: 50 },
    { id: DeprecatedDuration["1.5h"], label: "1H½", minutes: 80 },
    { id: DeprecatedDuration["2h"], label: "2H", minutes: 110 },
  ],
  categories: [
    { id: Category.Course, label: Category.Course },
    { id: Category.PreCompetitive, label: Category.PreCompetitive },
    { id: Category.Competitive, label: Category.Competitive },
    { id: Category.Adults, label: Category.Adults },
  ],
  types: [
    {
      id: SlotType.Ice,
      label: SlotType.Ice,
      color: "primary",
      icon: ProjectIcons.AcUnit,
    },
    {
      id: SlotType.OffIceDancing,
      label: SlotType.OffIceDancing,
      color: "secondary",
      icon: ProjectIcons.AccessibilityNew,
    },
    {
      id: SlotType.OffIceGym,
      label: SlotType.OffIceGym,
      color: "secondary",
      icon: ProjectIcons.FitnessCenter,
    },
  ],
};

export interface MappedSlotLabels {
  durations: Record<DurationEntry["id"], Omit<DurationEntry, "id">>;
  categories: Record<CategoryEntry["id"], Omit<CategoryEntry, "id">>;
  types: Record<SlotTypeEntry["id"], Omit<SlotTypeEntry, "id">>;
}

// But we often need a map, so we build one here.
export const slotsLabels = Object.keys(slotsLabelsLists).reduce((acc, el) => {
  acc[el] = _.keyBy(slotsLabelsLists[el], "id");
  return acc;
}, {} as MappedSlotLabels);

if (Object.freeze) {
  Object.freeze(slotsLabels);
  Object.freeze(slotsLabelsLists);
}
