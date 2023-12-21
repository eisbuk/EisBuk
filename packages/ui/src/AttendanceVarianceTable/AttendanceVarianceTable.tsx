import React from "react";
import { DateTime } from "luxon";

import {
  useTranslation,
  DateFormat,
  AttendanceVarianceHeaders,
} from "@eisbuk/translations";
import { SlotType, wrapIter } from "@eisbuk/shared";

import { AthleteAttendanceMonth, RowItem } from "./types";

import Table, { TableCell, CellType, CellTextAlign } from "../Table";

import {
  isWeekend,
  createRowGenerator,
  transformAttendanceData,
} from "./utils";
import HoverText from "../HoverText";

interface TableProps {
  dates: string[];
  data: Iterable<AthleteAttendanceMonth>;
}

const AttendanceReportTable: React.FC<TableProps> = ({ dates, data }) => {
  const { t } = useTranslation();

  const dateHeaders = dates.reduce((acc, curDate) => {
    const dateTime = DateTime.fromISO(curDate);
    const weekday = t(DateFormat.Weekday, { date: dateTime });
    const day = t(DateFormat.Day, { date: dateTime });

    acc[curDate] = `${weekday} ${day}`;
    return acc;
  }, {});

  const headers = {
    athlete: t(AttendanceVarianceHeaders.Athlete),
    ...dateHeaders,
    total: t(AttendanceVarianceHeaders.Total),
  };

  const items = generateTableRows(dates, data);

  return (
    <div className="flex flex-col">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <Table
              headers={headers}
              items={items}
              renderHeaders={(headers) => (
                <tr>
                  {Object.keys(headers).map((key) => (
                    <TableCell
                      type={CellType.Header}
                      key={key}
                      textAlign={
                        headers[key] !== t(AttendanceVarianceHeaders.Athlete)
                          ? CellTextAlign.Center
                          : CellTextAlign.Left
                      }
                      isWaypoint={isWeekend(key)}
                    >
                      {headers[key]}
                    </TableCell>
                  ))}
                </tr>
              )}
              renderRow={(rowItem, rowIx, itemArr) => {
                const { slotType, ...data } = rowItem;

                const rowClasses =
                  slotType === SlotType.Ice
                    ? rowIx % 2 === 0
                      ? "bg-cyan-200/30"
                      : "bg-cyan-100/30"
                    : rowIx % 2 === 0
                    ? "bg-yellow-200/30"
                    : "bg-yellow-100/30";
                const cellClasses =
                  rowIx === itemArr.length - 1 ? undefined : "border-b-2";

                return (
                  <tr key={rowIx} className={rowClasses}>
                    {Object.entries(data).map(([date, cellItem], itemIx) => {
                      return itemIx === 0 ? (
                        <TableCell
                          key={`${date}-${cellItem}`}
                          type={CellType.Title}
                          className={stickyCellClasses.join(" ")}
                        >
                          <p className="inline-block w-32 truncate ...">
                            {cellItem}
                          </p>
                        </TableCell>
                      ) : itemIx === Object.keys(data).length - 1 ? (
                        <TableCell
                          key={`${date}-${cellItem}`}
                          textAlign={CellTextAlign.Center}
                          isWaypoint={isWeekend(date)}
                        >
                          <p className="leading-6">
                            {!cellItem ? "-" : `${cellItem}h`}
                          </p>
                        </TableCell>
                      ) : (
                        <TableCell
                          key={`${date}-${cellItem}`}
                          textAlign={CellTextAlign.Center}
                          isWaypoint={isWeekend(date)}
                          className={[
                            cellClasses,
                            `${
                              cellItem !== null &&
                              typeof cellItem !== "string" &&
                              typeof cellItem !== "number" &&
                              cellItem.booked !== undefined &&
                              cellItem.delta !== undefined &&
                              (cellItem.delta === 0
                                ? "bg-green-100 text-green-800"
                                : cellItem.delta > 0
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800")
                            }`,
                          ].join(" ")}
                        >
                          {cellItem === null
                            ? "-"
                            : cellItem &&
                              typeof cellItem !== "string" &&
                              typeof cellItem !== "number" &&
                              cellItem.booked !== undefined &&
                              cellItem.delta !== undefined && (
                                <>
                                  <HoverText
                                    text={cellItem.delta.toString() || ""}
                                  >
                                    <span>{cellItem.booked}</span>
                                  </HoverText>
                                </>
                              )}
                        </TableCell>
                      );
                    })}
                  </tr>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportTable;

const generateTableRows = (
  dates: Iterable<string>,
  data: Iterable<AthleteAttendanceMonth>
): RowItem[] => {
  const generateRow = createRowGenerator(dates);

  // We're genrating a couple rows for each athlete and then flattening them
  // to end up with a flat array of rows
  return wrapIter(data)
    .flatMap((data) => [
      generateRow(
        SlotType.Ice,
        data,
        transformAttendanceData((data) => data[SlotType.Ice])
      ),

      generateRow(
        SlotType.OffIce,
        data,
        transformAttendanceData((data) => data[SlotType.OffIce])
      ),
    ])
    .filter((rowItem): rowItem is RowItem => rowItem !== undefined)
    ._array();
};

const stickyCellClasses = [
  "sticky",
  "left-0",
  "z-50",
  "backdrop-blur-3xl",
  "backdrop-filter",
];
