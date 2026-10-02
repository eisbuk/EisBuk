import { DateTime } from "luxon";
import isEqual from "lodash/isEqual";

import {
  Category,
  SlotInterface,
  SlotInterval,
  SlotType,
} from "@eisbuk/shared";

/**
 * Everything in this file is pure. The language model lists the changes one by one
 * (each slot to create, update or delete); the code here checks the list, leaves out
 * what would harm the calendar, and renders what's left for the admin to confirm.
 * The plan the admin sees is the one handed over to the slot writer.
 */

// #region types
export interface IntervalInput {
  startTime: string;
  endTime: string;
}

export interface SlotCreate {
  date: string;
  type: SlotType;
  categories: Category[];
  intervals: IntervalInput[];
  /** `null` means no limit */
  capacity: number | null;
  /** `null` means no notes */
  notes: string | null;
}

/** New values for an existing slot: `null` leaves the field as it is */
export interface SlotUpdate {
  slotId: string;
  type: SlotType | null;
  categories: Category[] | null;
  intervals: IntervalInput[] | null;
  capacity: number | null;
  removeCapacity: boolean;
  /** An empty string removes the notes */
  notes: string | null;
}

export interface SlotChangeRequest {
  create: SlotCreate[];
  update: SlotUpdate[];
  /** Ids of the slots to delete */
  delete: string[];
}

export type SlotDraft = Omit<SlotInterface, "id">;

export type SkipReason =
  | "duplicate"
  | "unchanged"
  | "has-bookings"
  | "booked-interval-removed";

export interface SlotPlan {
  creates: SlotDraft[];
  updates: { id: string; before: SlotInterface; after: SlotInterface }[];
  deletes: SlotInterface[];
  skipped: { reason: SkipReason; slot: SlotDraft; slotId?: string }[];
}

/** Intervals booked by at least one athlete, keyed by slot id */
export type BookedIntervals = Record<string, string[]>;
// #endregion types

// #region limits
/** New slots of one request have to fall within this many days */
export const MAX_RANGE_DAYS = 370;
export const MAX_OPERATIONS = 500;
// #endregion limits

// #region parsing
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const isSet = (x: unknown) => x !== null && x !== undefined;

const isISODate = (x: unknown): x is string =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  DateTime.fromISO(x).isValid;

/**
 * Brings a time to the zero padded "HH:mm" form ("9:00" -> "09:00").
 * Returns `null` if the string is not a valid time of day.
 */
export const normalizeTime = (time: unknown): string | null => {
  if (typeof time !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
};

const validSlotTypes = Object.values(SlotType) as string[];
const validCategories = Object.values(Category) as string[];

/**
 * Parsers for each part of the request. They never throw: problems are collected in `errors`
 * (with the path of the offending field) and a harmless fallback value is used in its place.
 */
const createRequestParser = () => {
  const errors: string[] = [];

  const fail = <T>(path: string, message: string, fallback: T): T => {
    errors.push(`${path}: ${message}`);
    return fallback;
  };

  const parseArray = (x: unknown, path: string): unknown[] =>
    Array.isArray(x) ? x : fail(path, "expected an array", []);

  const parseRecord = (x: unknown, path: string): Record<string, unknown> =>
    isRecord(x) ? x : fail(path, "expected an object", {});

  const parseCategories = (x: unknown, path: string): Category[] => {
    const values = parseArray(x, path);
    if (!values.every((c) => validCategories.includes(c as string))) {
      return fail(
        path,
        `categories must be among ${validCategories.join(", ")}`,
        [],
      );
    }
    if (!values.length) fail(path, "at least one category is required", null);
    return [...new Set(values as Category[])];
  };

  const parseSlotType = (x: unknown, path: string): SlotType =>
    validSlotTypes.includes(x as string)
      ? (x as SlotType)
      : fail(
          path,
          `type must be one of ${validSlotTypes.join(", ")}`,
          SlotType.Ice,
        );

  const parseIntervals = (x: unknown, path: string): IntervalInput[] => {
    const parsed = parseArray(x, path).map((interval, i) => {
      const startTime = normalizeTime(isRecord(interval) && interval.startTime);
      const endTime = normalizeTime(isRecord(interval) && interval.endTime);
      if (!startTime || !endTime) {
        return fail(`${path}[${i}]`, "times must be in HH:mm format", null);
      }
      if (startTime >= endTime) {
        return fail(`${path}[${i}]`, "startTime must be before endTime", null);
      }
      return { startTime, endTime };
    });
    if (!parsed.length) fail(path, "at least one interval is required", null);
    return parsed.filter((i): i is IntervalInput => Boolean(i));
  };

  const parseCapacity = (x: unknown, path: string): number | null => {
    if (!isSet(x)) return null;
    return Number.isInteger(x) && (x as number) > 0
      ? (x as number)
      : fail(path, "capacity must be a positive integer or null", null);
  };

  const parseNotes = (x: unknown, path: string): string | null => {
    if (!isSet(x)) return null;
    return typeof x === "string"
      ? x.trim()
      : fail(path, "notes must be a string or null", null);
  };

  const parseSlotId = (x: unknown, path: string): string =>
    typeof x === "string" && x
      ? x
      : fail(path, "expected the id of a slot (from list_slots)", "");

  const parseCreate = (x: unknown, path: string): SlotCreate => {
    const slot = parseRecord(x, path);
    return {
      date: isISODate(slot.date)
        ? slot.date
        : fail(`${path}.date`, "must be a valid yyyy-mm-dd date", ""),
      type: parseSlotType(slot.type, `${path}.type`),
      categories: parseCategories(slot.categories, `${path}.categories`),
      intervals: parseIntervals(slot.intervals, `${path}.intervals`),
      capacity: parseCapacity(slot.capacity, `${path}.capacity`),
      notes: parseNotes(slot.notes, `${path}.notes`),
    };
  };

  const parseUpdate = (x: unknown, path: string): SlotUpdate => {
    const update = parseRecord(x, path);
    return {
      slotId: parseSlotId(update.slotId, `${path}.slotId`),
      type: isSet(update.type)
        ? parseSlotType(update.type, `${path}.type`)
        : null,
      categories: isSet(update.categories)
        ? parseCategories(update.categories, `${path}.categories`)
        : null,
      intervals: isSet(update.intervals)
        ? parseIntervals(update.intervals, `${path}.intervals`)
        : null,
      capacity: parseCapacity(update.capacity, `${path}.capacity`),
      removeCapacity: update.removeCapacity === true,
      notes: parseNotes(update.notes, `${path}.notes`),
    };
  };

  const parseRequest = (x: unknown): SlotChangeRequest => {
    const input = parseRecord(x, "input");
    const request = {
      create: parseArray(input.create ?? [], "create").map((slot, i) =>
        parseCreate(slot, `create[${i}]`),
      ),
      update: parseArray(input.update ?? [], "update").map((update, i) =>
        parseUpdate(update, `update[${i}]`),
      ),
      delete: [
        ...new Set(
          parseArray(input.delete ?? [], "delete").map((id, i) =>
            parseSlotId(id, `delete[${i}]`),
          ),
        ),
      ],
    };

    if (
      !request.create.length &&
      !request.update.length &&
      !request.delete.length
    ) {
      fail("input", "nothing to create, update or delete was given", null);
    }
    request.update
      .filter(({ slotId }) => slotId && request.delete.includes(slotId))
      .forEach(({ slotId }) =>
        fail("update", `slot ${slotId} is both updated and deleted`, null),
      );

    return request;
  };

  return { errors, parseRequest };
};

/**
 * The earliest and the latest date of the slots to create (`null` if none is created):
 * the slots already in that range are needed to tell which lessons are already there.
 */
export const getCreateDateRange = (request: SlotChangeRequest) => {
  const dates = request.create.map(({ date }) => date).sort();
  return dates.length
    ? { fromDate: dates[0], toDate: dates[dates.length - 1] }
    : null;
};

/** Ids of the existing slots the request refers to */
export const getReferencedSlotIds = (request: SlotChangeRequest) => [
  ...new Set([
    ...request.update.map(({ slotId }) => slotId),
    ...request.delete,
  ]),
];

/**
 * Checks the tool input coming from the language model and brings it to a canonical
 * form (zero padded times, deduplicated lists). The errors are written for the model:
 * they are sent back as the tool result so that it can correct the request.
 */
export const parseSlotChangeRequest = (
  input: unknown,
): { request: SlotChangeRequest; errors: string[] } => {
  const parser = createRequestParser();
  const request = parser.parseRequest(input);

  const range = !parser.errors.length && getCreateDateRange(request);
  if (range) {
    const { days } = DateTime.fromISO(range.toDate).diff(
      DateTime.fromISO(range.fromDate),
      "days",
    );
    if (days > MAX_RANGE_DAYS) {
      parser.errors.push(
        `the new slots span ${days} days, the maximum is ${MAX_RANGE_DAYS}: split the request`,
      );
    }
  }

  return { request, errors: parser.errors };
};
// #endregion parsing

// #region planning
const isoWeekday = (date: string) => DateTime.fromISO(date).weekday;

const toIntervalsRecord = (intervals: IntervalInput[]) =>
  intervals.reduce(
    (acc, { startTime, endTime }) => ({
      ...acc,
      [`${startTime}-${endTime}`]: { startTime, endTime },
    }),
    {} as Record<string, SlotInterval>,
  );

/** Two slots are the same lesson if they share the day, the type, the categories and the times */
const isSameLesson = (a: SlotDraft, b: SlotDraft) =>
  a.date === b.date &&
  a.type === b.type &&
  isEqual([...a.categories].sort(), [...b.categories].sort()) &&
  isEqual(Object.keys(a.intervals).sort(), Object.keys(b.intervals).sort());

const toDraft = (slot: SlotCreate): SlotDraft => ({
  date: slot.date,
  type: slot.type,
  categories: slot.categories,
  intervals: toIntervalsRecord(slot.intervals),
  ...(slot.capacity ? { capacity: slot.capacity } : {}),
  ...(slot.notes ? { notes: slot.notes } : {}),
});

const applyUpdate = (
  slot: SlotInterface,
  update: SlotUpdate,
): SlotInterface => {
  const updated: SlotInterface = {
    ...slot,
    ...(update.type ? { type: update.type } : {}),
    ...(update.categories ? { categories: update.categories } : {}),
    ...(update.intervals
      ? { intervals: toIntervalsRecord(update.intervals) }
      : {}),
    ...(update.capacity ? { capacity: update.capacity } : {}),
    ...(update.notes ? { notes: update.notes } : {}),
  };
  if (update.removeCapacity) delete updated.capacity;
  if (update.notes === "") delete updated.notes;
  return updated;
};

/** Slot ids the request refers to that are not among the existing slots */
export const getUnknownSlotIds = (
  request: SlotChangeRequest,
  existingSlots: SlotInterface[],
) => {
  const existingIds = new Set(existingSlots.map(({ id }) => id));
  return getReferencedSlotIds(request).filter((id) => !existingIds.has(id));
};

/**
 * Turns a (valid) request into the plan: the changes that can go ahead, and the ones left out.
 * The language model decides what to create, update and delete; the code only keeps
 * the calendar safe, the way the web app does:
 * - a slot with bookings is not deleted
 * - an update can't take away an interval somebody booked
 * - a lesson that's already in the calendar is not created a second time
 *
 * @param existingSlots the slots the request refers to, and the ones on the days new slots are created
 * @param bookedIntervals intervals athletes have booked, for the slots the request refers to
 */
export const buildSlotPlan = (
  request: SlotChangeRequest,
  existingSlots: SlotInterface[],
  bookedIntervals: BookedIntervals,
): SlotPlan => {
  const plan: SlotPlan = { creates: [], updates: [], deletes: [], skipped: [] };
  const slotsById = new Map(existingSlots.map((slot) => [slot.id, slot]));
  const getSlots = (ids: string[]) =>
    ids
      .map((id) => slotsById.get(id))
      .filter((slot): slot is SlotInterface => Boolean(slot));

  getSlots(request.delete).forEach((slot) => {
    if (bookedIntervals[slot.id]?.length) {
      plan.skipped.push({ reason: "has-bookings", slot, slotId: slot.id });
    } else {
      plan.deletes.push(slot);
    }
  });

  // A slot might be listed more than once: the updates add up, in order
  getSlots([...new Set(request.update.map(({ slotId }) => slotId))]).forEach(
    (before) => {
      const after = request.update
        .filter(({ slotId }) => slotId === before.id)
        .reduce(applyUpdate, before);

      if (isEqual(before, after)) {
        plan.skipped.push({
          reason: "unchanged",
          slot: before,
          slotId: before.id,
        });
        return;
      }
      const removesBookedInterval = (bookedIntervals[before.id] || []).some(
        (interval) => !after.intervals[interval],
      );
      if (removesBookedInterval) {
        plan.skipped.push({
          reason: "booked-interval-removed",
          slot: before,
          slotId: before.id,
        });
        return;
      }
      plan.updates.push({ id: before.id, before, after });
    },
  );

  // Never duplicate a lesson that's already there (as it will be after the changes above)
  const deletedIds = new Set(plan.deletes.map(({ id }) => id));
  const updatedById = new Map(plan.updates.map(({ id, after }) => [id, after]));
  const slotsAfterChanges = existingSlots
    .filter(({ id }) => !deletedIds.has(id))
    .map((slot) => updatedById.get(slot.id) || slot);
  request.create.map(toDraft).forEach((draft) => {
    const duplicate =
      slotsAfterChanges.some((slot) => isSameLesson(slot, draft)) ||
      plan.creates.some((slot) => isSameLesson(slot, draft));
    if (duplicate) {
      plan.skipped.push({ reason: "duplicate", slot: draft });
    } else {
      plan.creates.push(draft);
    }
  });

  return plan;
};

export const countOperations = (plan: SlotPlan) =>
  plan.creates.length + plan.updates.length + plan.deletes.length;

/**
 * The changes of a plan the admin chose to keep: new slots by their position
 * in `creates`, updates and deletions by slot id.
 */
export interface PlanSelection {
  creates: number[];
  updates: string[];
  deletes: string[];
}

/**
 * Narrows the plan down to the selected changes. A selection can only take
 * changes away: whatever it holds that isn't in the plan is ignored.
 */
export const applySelection = (
  plan: SlotPlan,
  selection: PlanSelection,
): SlotPlan => ({
  creates: plan.creates.filter((_, i) => selection.creates.includes(i)),
  updates: plan.updates.filter(({ id }) => selection.updates.includes(id)),
  deletes: plan.deletes.filter(({ id }) => selection.deletes.includes(id)),
  skipped: plan.skipped,
});
// #endregion planning

// #region rendering
const weekdayLabels = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const slotTypeLabels: Record<SlotType, string> = {
  [SlotType.Ice]: "Ghiaccio",
  [SlotType.OffIce]: "Secco",
};
const categoryLabels: Record<Category, string> = {
  [Category.PreCompetitiveAdults]: "pre-agonismo adulti",
  [Category.PreCompetitiveMinors]: "pre-agonismo ragazzi",
  [Category.CourseAdults]: "corso adulti",
  [Category.CourseMinors]: "corso ragazzi",
  [Category.Competitive]: "agonismo",
  [Category.PrivateLessons]: "lezioni private",
};
const skipReasonLabels: Record<SkipReason, string> = {
  duplicate: "esiste già, non lo creo di nuovo",
  unchanged: "è già così, nessuna modifica",
  "has-bookings": "ha prenotazioni, non si può eliminare",
  "booked-interval-removed": "la modifica toglierebbe un orario già prenotato",
};

/** Lines shown per section before the rest is summed up as "... e altri N" */
const MAX_LINES_PER_SECTION = 40;
const MAX_DATES_PER_LINE = 12;

const formatDay = (date: string) => DateTime.fromISO(date).toFormat("dd/MM");
const formatDayWithWeekday = (date: string) =>
  `${weekdayLabels[isoWeekday(date) - 1]} ${formatDay(date)}`;
const formatTimes = (slot: SlotDraft) =>
  Object.keys(slot.intervals).sort().join(", ");
const formatCategories = (slot: SlotDraft) =>
  slot.categories
    .map((category) => categoryLabels[category] || category)
    .join(", ");
const formatCapacity = (capacity?: number) =>
  capacity ? `max ${capacity}` : "nessun limite";

/** Describes everything about the slot except for its date */
const describeLesson = (slot: SlotDraft) =>
  [
    `${slotTypeLabels[slot.type] || slot.type} ${formatTimes(slot)}`,
    formatCategories(slot),
    ...(slot.capacity ? [formatCapacity(slot.capacity)] : []),
    ...(slot.notes ? [`note: ${slot.notes}`] : []),
  ].join(" · ");

const describeSlot = (slot: SlotDraft) =>
  `${formatDayWithWeekday(slot.date)} — ${describeLesson(slot)}`;

const listChanges = (before: SlotInterface, after: SlotInterface) =>
  [
    before.type !== after.type &&
      `tipo: ${slotTypeLabels[before.type]} → ${slotTypeLabels[after.type]}`,
    !isEqual(
      Object.keys(before.intervals).sort(),
      Object.keys(after.intervals).sort(),
    ) && `orari: ${formatTimes(before)} → ${formatTimes(after)}`,
    !isEqual([...before.categories].sort(), [...after.categories].sort()) &&
      `categorie: ${formatCategories(before)} → ${formatCategories(after)}`,
    before.capacity !== after.capacity &&
      `capienza: ${formatCapacity(before.capacity)} → ${formatCapacity(after.capacity)}`,
    (before.notes || "") !== (after.notes || "") &&
      `note: ${before.notes || "(nessuna)"} → ${after.notes || "(nessuna)"}`,
  ].filter((change): change is string => Boolean(change));

const capLines = (lines: string[]) =>
  lines.length > MAX_LINES_PER_SECTION
    ? [
        ...lines.slice(0, MAX_LINES_PER_SECTION),
        `… e altri ${lines.length - MAX_LINES_PER_SECTION}`,
      ]
    : lines;

/**
 * New slots are grouped by weekday and lesson, one line per group:
 * "mar 03/11, 10/11, 17/11 — Ghiaccio 17:00-18:00 · agonismo"
 */
const describeCreates = (creates: SlotDraft[]): string[] => {
  const groups = new Map<string, { lesson: string; dates: string[] }>();
  [...creates]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((slot) => {
      const lesson = describeLesson(slot);
      const key = `${isoWeekday(slot.date)}|${lesson}`;
      const group = groups.get(key) || { lesson, dates: [] };
      group.dates.push(slot.date);
      groups.set(key, group);
    });

  return [...groups.values()].map(({ lesson, dates }) => {
    const shown = dates.slice(0, MAX_DATES_PER_LINE).map(formatDay).join(", ");
    const more =
      dates.length > MAX_DATES_PER_LINE
        ? ` … fino al ${formatDay(dates[dates.length - 1])} (${dates.length} date)`
        : "";
    return `• ${weekdayLabels[isoWeekday(dates[0]) - 1]} ${shown}${more} — ${lesson}`;
  });
};

/**
 * The preview the admin is asked to confirm. It's rendered from the plan itself
 * (not written by the language model), so what's shown is what would be written.
 */
export const renderPlanPreview = (plan: SlotPlan): string => {
  const allDates = [
    ...plan.creates,
    ...plan.updates.map(({ before }) => before),
    ...plan.deletes,
  ]
    .map(({ date }) => date)
    .sort();

  const sections: string[] = [];

  if (allDates.length) {
    const format = (date: string) =>
      DateTime.fromISO(date).toFormat("dd/MM/yyyy");
    sections.push(
      `Periodo: ${format(allDates[0])} – ${format(allDates[allDates.length - 1])}`,
    );
  }
  if (plan.creates.length) {
    sections.push(
      [
        `➕ Nuovi slot: ${plan.creates.length}`,
        ...capLines(describeCreates(plan.creates)),
      ].join("\n"),
    );
  }
  if (plan.updates.length) {
    sections.push(
      [
        `✏️ Slot modificati: ${plan.updates.length}`,
        ...capLines(
          plan.updates.map(
            ({ before, after }) =>
              `• ${describeSlot(before)}\n   ${listChanges(before, after).join("; ")}`,
          ),
        ),
      ].join("\n"),
    );
  }
  if (plan.deletes.length) {
    sections.push(
      [
        `🗑 Slot eliminati: ${plan.deletes.length}`,
        ...capLines(plan.deletes.map((slot) => `• ${describeSlot(slot)}`)),
      ].join("\n"),
    );
  }
  if (plan.skipped.length) {
    sections.push(
      [
        `⚠️ Lasciati come sono: ${plan.skipped.length}`,
        ...capLines(
          plan.skipped.map(
            ({ slot, reason }) =>
              `• ${describeSlot(slot)}: ${skipReasonLabels[reason]}`,
          ),
        ),
      ].join("\n"),
    );
  }

  return sections.join("\n\n");
};
// #endregion rendering

// #region view
const monthLabels = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];

/** "3 nov" */
const formatShortDate = (date: string) => {
  const { day, month } = DateTime.fromISO(date);
  return `${day} ${monthLabels[month - 1]}`;
};

/**
 * The plan as shown by the mini app: the same content as the text preview, with texts
 * ready to display and a key for each change that can be left out
 * (the keys are the ones a `PlanSelection` is made of).
 */
export interface PlanView {
  period: string | null;
  /** New slots, grouped by lesson and then by weekday */
  creates: {
    type: SlotType;
    title: string;
    subtitle: string;
    weekdays: { label: string; dates: { index: number; label: string }[] }[];
  }[];
  updates: { id: string; title: string; changes: string[] }[];
  deletes: { id: string; title: string }[];
  skipped: { title: string; reason: string }[];
}

export const buildPlanView = (plan: SlotPlan): PlanView => {
  const allDates = [
    ...plan.creates,
    ...plan.updates.map(({ before }) => before),
    ...plan.deletes,
  ]
    .map(({ date }) => date)
    .sort();
  const formatFull = (date: string) =>
    DateTime.fromISO(date).toFormat("dd/MM/yyyy");

  const lessons = new Map<string, PlanView["creates"][number]>();
  plan.creates
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => a.slot.date.localeCompare(b.slot.date))
    .forEach(({ slot, index }) => {
      const title = `${slotTypeLabels[slot.type] || slot.type} ${formatTimes(
        slot,
      )}`;
      const subtitle = [
        formatCategories(slot),
        ...(slot.capacity ? [formatCapacity(slot.capacity)] : []),
        ...(slot.notes ? [`note: ${slot.notes}`] : []),
      ].join(" · ");
      const key = `${title}|${subtitle}`;
      const lesson = lessons.get(key) || {
        type: slot.type,
        title,
        subtitle,
        weekdays: [],
      };
      lessons.set(key, lesson);

      const label = weekdayLabels[isoWeekday(slot.date) - 1];
      let weekday = lesson.weekdays.find((entry) => entry.label === label);
      if (!weekday) {
        weekday = { label, dates: [] };
        lesson.weekdays.push(weekday);
      }
      weekday.dates.push({ index, label: formatShortDate(slot.date) });
    });

  return {
    period: allDates.length
      ? `${formatFull(allDates[0])} – ${formatFull(
          allDates[allDates.length - 1],
        )}`
      : null,
    creates: [...lessons.values()],
    updates: plan.updates.map(({ id, before, after }) => ({
      id,
      title: describeSlot(before),
      changes: listChanges(before, after),
    })),
    deletes: plan.deletes.map((slot) => ({
      id: slot.id,
      title: describeSlot(slot),
    })),
    skipped: plan.skipped.map(({ slot, reason }) => ({
      title: describeSlot(slot),
      reason: skipReasonLabels[reason],
    })),
  };
};
// #endregion view
