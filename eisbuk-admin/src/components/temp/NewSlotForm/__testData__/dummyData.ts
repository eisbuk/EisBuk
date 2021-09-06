import { DateTime } from "luxon";

import { Category, SlotType } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";
import { SlotFormValues } from "@/lib/data";

import { SlotInterface } from "@/types/temp";

import { luxonToFB } from "@/utils/date";
import { slotToFormValues } from "../utils";

const date = luxonToFB(DateTime.fromISO(__storybookDate__));

/**
 * A generic, dummy slot we're using for tests as well as stories
 */
export const dummySlot: SlotInterface = {
  id: "some-random-slot",
  date,
  type: SlotType.OffIceDancing,
  categories: Object.values(Category),
  intervals: { ["10:00-11:30"]: { startTime: "10:00", endTime: "11:30" } },
  notes: "",
};

/**
 * Form values of dummySlot when passed as `slotToEdit` to `SlotForm`
 */
export const { date: a, ...dummySlotFormValues } = slotToFormValues(dummySlot)!;
