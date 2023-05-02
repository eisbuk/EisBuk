import React from "react";
import { DateTime } from "luxon";

import i18n, {
  useTranslation,
  DateFormat,
  PrintableAttendance,
} from "@eisbuk/translations";
import { CustomerWithAttendance, SlotType } from "@eisbuk/shared";

import Table from "../Table";
import { calculateIntervalDuration } from "./utils";

interface RowItem {
  [key: string]: string | number | boolean | null;
  type: SlotType;
  start: string;
  end: string;
  totalHours: string;
  note: string;
  trainer: string;
  athlete: string;
  signature: string;
  personalNote: string;
}

const headers = {
  type: i18n.t("Type") /** @TODO update */,
  start: i18n.t(PrintableAttendance.Start),
  end: i18n.t(PrintableAttendance.End),
  totalHours: i18n.t(PrintableAttendance.TotalHours),
  note: i18n.t(PrintableAttendance.Note),
  trainer: i18n.t(PrintableAttendance.Trainer),
  athlete: i18n.t(PrintableAttendance.Athlete),
  signature: i18n.t(PrintableAttendance.Signature),
  personalNote: i18n.t(PrintableAttendance.Note),
};

interface TableDataEntry {
  customers: CustomerWithAttendance[];
  type: SlotType;
  notes?: string;
}

export interface AttendanceSheetProps {
  date: DateTime;
  organizationName?: string;
  data: TableDataEntry[];
}

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  date,
  data,
  organizationName = "",
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <h2 className="flex justify-center items-center print:m-0">
        {organizationName}
      </h2>

      <div className="py-2 bg-gray-800 font-semibold text-center text-white">
        {`${t(DateFormat.Date)}: ${t(DateFormat.FullWithWeekday, { date })}`}
      </div>

      <Table
        headers={headers}
        items={processTableData(data)}
        renderHeaders={(headers) => (
          <tr className="border border-gray-800">
            {Object.values(headers)
              // Type is a necessary property per row basis, but is not a cell in itself.
              // Therefore, it doesn't have a label and we can filter it out by absence of label.
              .filter(Boolean)
              .map((label) => (
                <th className="p-1 border border-gray-200 min-w-[3rem]">
                  {label}
                </th>
              ))}
          </tr>
        )}
        renderRow={(rowData, rowIx) => (
          <tr
            key={rowIx}
            className={`p-0 max-w-full border border-gray-200 text-center`}
          >
            {Object.entries(rowData).map(([key, data]) => (
              <td
                style={{ printColorAdjust: "exact" }}
                className="min-w-[3rem] max-w-[7rem] p-1 bg-inherit text-gray-500 border border-gray-200 truncate print:text-black"
              >
                {key === "type" ? (
                  <span
                    className={`px-2 py-0.5 ${
                      data === SlotType.Ice ? "bg-cyan-100" : "bg-yellow-100"
                    } rounded-lg print:font-normal print:bg-none`}
                  >
                    {data}
                  </span>
                ) : (
                  data
                )}
              </td>
            ))}
          </tr>
        )}
      />
    </div>
  );
};

const processTableData = (entries: TableDataEntry[]): RowItem[] =>
  entries.reduce((acc, { type, notes, customers }) => {
    const newRows = customers
      // We're not displaying customers that have no booked interval.
      .filter(({ bookedInterval }) => Boolean(bookedInterval))
      .map(({ name, surname, bookedInterval }) => {
        const [start, end] = bookedInterval!.split("-");
        const totalHours = calculateIntervalDuration(start, end);

        return {
          type,
          start,
          end,
          totalHours,
          note: notes,
          trainer: "",
          athlete: `${name} ${surname}`,
          personalNote: "",
          signature: "",
        } as RowItem;
      });
    return [...acc, ...newRows];
  }, [] as RowItem[]);

export default AttendanceSheet;
