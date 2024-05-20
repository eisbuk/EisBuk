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
  slotType: SlotType;
  athlete: string;
  total: { booked: number; delta: number };
  totalNotBooked: { booked: number; delta: number };
  totalNotAttended: { booked: number; delta: number };
}

interface RowData {
  [dateStr: string]: { booked: number; delta: number } | string | null;
}

export type RowItem = RowData & RowDataFixedProperties;
