import React from "react";
import { DateTime } from "luxon";

import i18n, {
  PrintableAttendance,
  useTranslation,
  DateFormat,
} from "@eisbuk/translations";
import { CustomerWithAttendance, SlotType } from "@eisbuk/shared";

import { calculateIntervalDuration } from "./utils";
import Table from "../Table";

interface RowItem {
  [key: string]: string | number | boolean | null;
  type: SlotType;
  start: string;
  end: string;
  totalHours: string;
  trainer: string;
  athlete: string;
  athleteSurname: string;
  notes: string;
}

const headers = {
  type: i18n.t("Type") /** @TODO update */,
  start: i18n.t(PrintableAttendance.Start),
  end: i18n.t(PrintableAttendance.End),
  totalHours: "\uD83D\uDD51",
  trainer: i18n.t(PrintableAttendance.Trainer),
  athlete: i18n.t(PrintableAttendance.Athlete),
  notes: i18n.t(PrintableAttendance.Note),
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
    <div>
      <div className="py-2 bg-gray-800 font-semibold text-center text-white">
        <h2 className="font-fredoka hidden print:flex print:justify-center print:items-center">
          {organizationName}
        </h2>
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
              .map(([label]) => (
                <th className="border border-gray-200 print:border-black">
                  {label}
                </th>
              ))}
          </tr>
        )}
        renderRow={(rowData, rowIx) => (
          <>
            <tr
              key={rowIx}
              className={`border border-gray-200 text-center print:border-black`}
            >
              {/* Skip the athleteSurname column */}
              {Object.entries(rowData).map(
                ([key, data]) =>
                  key !== "athleteSurname" && (
                    <td
                      style={{ printColorAdjust: "exact" }}
                      className={`bg-inherit text-gray-500 border border-gray-200 truncate print:text-black print:border-black 
                      ${key === "athlete" && "text-left"}
                 
                      
                      `}
                    >
                      {key === "type" ? (
                        <span
                          className={`py-0.5 ${
                            data === SlotType.Ice
                              ? "bg-cyan-100"
                              : "bg-yellow-100"
                          } rounded-lg print:font-normal print:bg-none`}
                        >
                          {data}
                        </span>
                      ) : key === "athlete" ? (
                        <>
                          <b>{rowData["athleteSurname"]} </b>
                          {data}
                        </>
                      ) : (
                        data
                      )}
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
          notes: "",
        } as RowItem;
      });
    return [...acc, ...newRows];
  }, [] as RowItem[]);

export default AttendanceSheet;
