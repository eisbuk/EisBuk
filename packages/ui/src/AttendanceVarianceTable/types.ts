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

export interface RowItem {
  athlete: string;
  [dateStr: string]: string | number | null;
  total: number;
  type: HoursType;
  slotType: SlotType;
}
