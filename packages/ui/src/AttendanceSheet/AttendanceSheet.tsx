import React from "react";

import i18n, { PrintableAttendance } from "@eisbuk/translations";
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
  athleteSurname: string;
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
  personalNote: i18n.t(PrintableAttendance.Note),
};

interface TableDataEntry {
  customers: CustomerWithAttendance[];
  type: SlotType;
  notes?: string;
}

export interface AttendanceSheetProps {
  data: TableDataEntry[];
}

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ data }) => {
  return (
    <div className="w-full">
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
                <th className="p-1 border border-l- border-gray-200 min-w-[3rem]">
                  {label}
                </th>
              ))}
          </tr>
        )}
        renderRow={(rowData, rowIx) => (
          <>
            <tr
              key={rowIx}
              className={`p-0 max-w-full border border-gray-200 text-center`}
            >
              {/* Skip the athleteSurname column */}
              {Object.entries(rowData).map(
                ([key, data]) =>
                  key !== "athleteSurname" && (
                    <td
                      style={{ printColorAdjust: "exact" }}
                      className="min-w-[3rem] max-w-[7rem] p-1 bg-inherit text-gray-500 border border-gray-200 truncate print:text-black"
                    >
                      {key === "type" ? (
                        <span
                          className={`px-2 py-0.5 ${
                            data === SlotType.Ice
                              ? "bg-cyan-100"
                              : "bg-yellow-100"
                          } rounded-lg print:font-normal print:bg-none`}
                        >
                          {data}
                        </span>
                      ) : key === "athlete" ? (
                        <tr>
                          <td className="min-w-[4.25rem] max-w-0 truncate print:text-black">
                            {data}
                          </td>
                          <td className="max-w-0 print:text-black font-bold">
                            {rowData["athleteSurname"]}
                          </td>
                        </tr>
                      ) : (
                        data
                      )}
                    </td>
                  )
              )}
            </tr>
            <tr className={`p-0 max-w-full border border-gray-200`}>
              {Object.keys(rowData).map(
                (key) =>
                  key !== "athleteSurname" && (
                    <td
                      style={{ printColorAdjust: "exact" }}
                      className="p-1 bg-inherit truncate"
                    >
                      &nbsp;
                    </td>
                  )
              )}
            </tr>
          </>
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
          athlete: name,
          athleteSurname: surname,
          personalNote: "",
        } as RowItem;
      });
    return [...acc, ...newRows];
  }, [] as RowItem[]);

export default AttendanceSheet;
