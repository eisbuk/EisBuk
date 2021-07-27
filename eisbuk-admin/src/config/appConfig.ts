import _ from "lodash";

import { SlotType, Duration, Category } from "@functions/enums/firestore";
import { ProjectIcons } from "@/enums/components";

interface DurationEntry {
  id: Duration;
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
    { id: Duration["1h"], label: "1H", minutes: 50 },
    { id: Duration["1.5h"], label: "1H½", minutes: 80 },
    { id: Duration["2h"], label: "2H", minutes: 110 },
  ],
  categories: [
    { id: Category.Course, label: "Course" },
    { id: Category.PreCompetitive, label: "PreCompetitive" },
    { id: Category.Competitive, label: "Competitive" },
    { id: Category.Adults, label: "Adults" },
  ],
  types: [
    {
      id: SlotType.Ice,
      label: "Ice",
      color: "primary",
      icon: ProjectIcons.AcUnit,
    },
    {
      id: SlotType.OffIceDancing,
      label: "OffIceDancing",
      color: "secondary",
      icon: ProjectIcons.AccessibilityNew,
    },
    {
      id: SlotType.OffIceGym,
      label: "OffIceGym",
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
