import { SlotType } from "@eisbuk/shared";

export type AthleteNamePair<T> = [fullName: string, data: T];
export type DateAttendancePair<T> = [date: string, data: T];

export type HoursType = "booked" | "attended" | "delta";

export type AttendanceDurations = {
  [T in Exclude<HoursType, "delta">]: number;
};

export type AttendanceByDate = Iterable<
  DateAttendancePair<AttendanceBySlotType>
>;

export type AttendanceBySlotType = {
  [T in SlotType]: AttendanceDurations;
};

export type AthleteAttendanceMonth = AthleteNamePair<AttendanceByDate>;

interface RowDataFixedProperties {
  athlete: string;
  total: number;
  slotType: SlotType;
}

interface RowData {
  [dateStr: string]: { booked: number; delta: number } | number | string | null;
}

export type RowItem = RowData & RowDataFixedProperties;
