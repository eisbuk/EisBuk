import React from "react";
import { DateTime } from "luxon";

import {
  useTranslation,
  DateFormat,
  AttendanceVarianceHeaders,
} from "@eisbuk/translations";
import { SlotType, wrapIter } from "@eisbuk/shared";

import { AthleteAttendanceMonth } from "./types";

import Table, { TableCell, CellType, CellTextAlign } from "../Table";
import VarianceBadge from "./VarianceBadge";
import SlotTypeIcon from "../SlotTypeIcon";

import { isWeekend, calculateDelta, createRowGenerator } from "./utils";

interface TableProps {
  dates: string[];
  data: Iterable<AthleteAttendanceMonth>;
}

interface RowContent {
  cellItem: string | number | boolean | null;
  date: string;
  itemIx: number;
  slotType: SlotType;
  classes?: string;
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
                const { type: rowType, slotType, ...data } = rowItem;

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
                    {Object.entries(data).map(([date, cellItem], itemIx) =>
                      rowType === "booked" ? (
                        <BookedRowCells
                          key={`${date}-${cellItem}`}
                          cellItem={cellItem}
                          itemIx={itemIx}
                          date={date}
                          slotType={slotType}
                        />
                      ) : (
                        <DeltaRowCells
                          key={`${date}-${cellItem}`}
                          cellItem={cellItem}
                          itemIx={itemIx}
                          date={date}
                          classes={cellClasses}
                          slotType={slotType}
                        />
                      )
                    )}
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
) => {
  const generateRow = createRowGenerator(dates);

  // We're genrating a couple rows for each athlete and then flattening them
  // to end up with a flat array of rows
  return wrapIter(data)
    .flatMap((data) => [
      generateRow(
        "booked",
        SlotType.Ice,
        data,
        ({ [SlotType.Ice]: { booked } }) => booked
      ),
      generateRow(
        "delta",
        SlotType.Ice,
        data,
        calculateDelta((data) => data[SlotType.Ice])
      ),
      generateRow(
        "booked",
        SlotType.OffIce,
        data,
        ({ [SlotType.OffIce]: { booked } }) => booked
      ),
      generateRow(
        "delta",
        SlotType.OffIce,
        data,
        calculateDelta((data) => data[SlotType.OffIce])
      ),
    ])
    ._array();
};

const BookedRowCells: React.FC<RowContent> = ({ cellItem, itemIx, date }) =>
  itemIx === 0 ? (
    <TableCell type={CellType.Title} className={stickyCellClasses.join(" ")}>
      <p className="inline-block w-32 truncate ...">
        {cellItem}
        <span className="sr-only">booked</span>
      </p>
    </TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center} isWaypoint={isWeekend(date)}>
      <p className="leading-6">{cellItem === null ? "-" : `${cellItem}h`}</p>
    </TableCell>
  );

const DeltaRowCells: React.FC<RowContent> = ({
  cellItem,
  itemIx,
  date,
  classes,
  slotType,
}) =>
  itemIx === 0 ? (
    <TableCell
      type={CellType.Title}
      className={`${classes} ${stickyCellClasses.join(" ")}`}
    >
      <SlotTypeIcon type={slotType} />
      <p className="sr-only">{`${cellItem} delta`}</p>
    </TableCell>
  ) : (
    <TableCell
      textAlign={CellTextAlign.Center}
      isWaypoint={isWeekend(date)}
      className={classes}
    >
      {cellItem === null ? "-" : <VarianceBadge delta={cellItem as number} />}
    </TableCell>
  );

const stickyCellClasses = [
  "sticky",
  "left-0",
  "z-5",
  "backdrop-blur-3xl",
  "backdrop-filter",
];
