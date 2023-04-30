/** @DUPLICATE_FILE @eisbuk/client/src/__testData__/attendance.ts */
import { gus, walt, saul, jian } from "./customers";

export const allCustomers = [gus, walt, saul, jian];

export const intervals = {
  "13:00-13:30": { startTime: "13:00", endTime: "13:30" },
  "13:00-14:00": { startTime: "13:00", endTime: "14:00" },
  "13:15-14:15": { startTime: "13:15", endTime: "14:15" },
};

export const intervalStrings = Object.keys(intervals);