import React from "react";

import i18n, {
  PrintableAttendance,
  useTranslation,
  DateFormat,
} from "@eisbuk/translations";
import { CustomerWithAttendance, SlotType } from "@eisbuk/shared";

import Table from "../Table";
import { calculateIntervalDuration } from "./utils";
import { DateTime } from "luxon";

interface RowItem {
  [key: string]: string | number | boolean | null;
  type: SlotType;
  start: string;
  end: string;
  totalHours: string;
  trainer: string;
  athlete: string;
  athleteSurname: string;
}

const headers = {
  type: i18n.t("Type") /** @TODO update */,
  start: i18n.t(PrintableAttendance.Start),
  end: i18n.t(PrintableAttendance.End),
  totalHours: i18n.t(PrintableAttendance.TotalHours),
  trainer: i18n.t(PrintableAttendance.Trainer),
  athlete: i18n.t(PrintableAttendance.Athlete),
};

interface TableDataEntry {
  customers: CustomerWithAttendance[];
  type: SlotType;
  notes?: string;
}

export interface AttendanceSheetProps {
  data: TableDataEntry[];
  date: DateTime;
  organizationName?: string;
}

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  data,
  organizationName,
  date,
}) => {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      <div className="py-2 bg-gray-800 font-semibold text-center text-white">
        <h2 className="font-fredoka hidden print:flex print:justify-center print:items-center print:m-0">
          {organizationName}
        </h2>
        {`${t(DateFormat.Date)}: ${t(DateFormat.FullWithWeekday, { date })}`}
      </div>

      <Table
        headers={headers}
        items={processTableData(data)}
        renderHeaders={(headers) => (
          <tr className=" border border-gray-800">
            {Object.values(headers)
              // Type is a necessary property per row basis, but is not a cell in itself.
              // Therefore, it doesn't have a label and we can filter it out by absence of label.
              .filter(Boolean)
              .map((label) => (
                <th className="p-1 border border-gray-200">{label}</th>
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
                      className="p-1 min-w-[3rem] max-w-[7rem] bg-inherit text-gray-500 border border-gray-200 truncate print:text-black"
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
                        <tr className="flex min-w-full ">
                          <td className="min-w-[5rem] max-w-[5rem] truncate print:text-black">
                            {data}
                          </td>
                          <td className="text-left truncate print:text-black font-bold">
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
            <tr className={`p-0 border border-gray-200`}>
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
  entries.reduce((acc, { type, customers }) => {
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
          trainer: "",
          athlete: name,
          athleteSurname: surname,
        } as RowItem;
      });
    return [...acc, ...newRows];
  }, [] as RowItem[]);

export default AttendanceSheet;
