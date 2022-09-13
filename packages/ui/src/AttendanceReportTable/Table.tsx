import React from "react";
import { DateTime } from "luxon";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import { Table, TableCell, CellType, CellTextAlign } from "../";
import VarianceBadge from "./VarianceBadge";
import {
  calculateDeltas,
  calculateTotals,
  collectDatesByHoursType,
  isWeekend,
  type HoursTuple,
} from "./utils";

export enum HoursType {
  Booked = "booked",
  Attended = "attended",
  Delta = "delta",
}

enum StaticHeaders {
  Athletes = "athletes",
  Total = "total",
}

export interface TableData {
  athlete: string;
  hours: {
    [dateStr: string]: HoursTuple;
  };
}

interface TableProps {
  dates: string[];
  data: TableData[];
}

interface RowItem {
  athlete: string;
  [dateStr: string]: string | number | null;
  total: number;
  type: HoursType;
}

interface RowContent {
  cellItem: string | number | boolean | null;
  itemIx: number;
  date: string;
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
    athlete: StaticHeaders.Athletes,
    ...dateHeaders,
    total: StaticHeaders.Total,
  };

  const items = data.reduce<RowItem[]>((acc, { athlete, hours }) => {
    const hoursWithDeltas = calculateDeltas(hours);

    const [totalBooked, , totalDelta] = calculateTotals(hoursWithDeltas);
    const { booked, delta } = collectDatesByHoursType(hoursWithDeltas);

    const athleteBooked = {
      type: HoursType.Booked,
      athlete,
      ...booked,
      total: totalBooked,
    };
    const athleteDelta = {
      type: HoursType.Delta,
      athlete,
      ...delta,
      total: totalDelta,
    };

    // Note: Returns alternating Booked-Delta rows for each athlete
    return [athleteBooked, athleteDelta, ...acc];
  }, []);

  return (
    <Table
      // TODO: header strings require translations
      headers={headers}
      items={items}
      renderHeaders={(headers) => {
        return (
          <tr>
            {Object.keys(headers).map((key) => (
              <TableCell
                type={CellType.Header}
                textAlign={
                  headers[key] !== StaticHeaders.Athletes
                    ? CellTextAlign.Center
                    : CellTextAlign.Left
                }
                waypoint={isWeekend(key)}
              >
                {headers[key]}
              </TableCell>
            ))}
          </tr>
        );
      }}
      renderRow={(rowItem, rowIx) => {
        const { type: rowType, ...data } = rowItem;
        const bgClasses = rowIx % 2 === 0 ? undefined : "bg-white";

        // TODO: this currently doesn't work because of `border-separate` set on parent table
        const borderClasses =
          rowType === HoursType.Booked ? "border-b-2" : undefined;

        const rowClasses = [borderClasses, bgClasses].join(" ");

        return (
          <tr key={rowIx} className={rowClasses}>
            {Object.entries(data).map(([date, cellItem], itemIx) =>
              rowType === HoursType.Booked ? (
                <BookedRowCells
                  cellItem={cellItem}
                  itemIx={itemIx}
                  date={date}
                />
              ) : (
                <DeltaRowCells
                  cellItem={cellItem}
                  itemIx={itemIx}
                  date={date}
                />
              )
            )}
          </tr>
        );
      }}
    />
  );
};

export default AttendanceReportTable;

// TODO: better semantic labelling for "Athlete" data, if its shown and/or hidden
const BookedRowCells: React.FC<RowContent> = ({ cellItem, itemIx, date }) =>
  itemIx === 0 ? (
    <TableCell type={CellType.Title}>{cellItem}</TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center} waypoint={isWeekend(date)}>
      <p className="leading-6">{cellItem === 0 ? "-" : `${cellItem}h`}</p>
    </TableCell>
  );

const DeltaRowCells: React.FC<RowContent> = ({ cellItem, itemIx, date }) =>
  itemIx === 0 ? (
    <TableCell type={CellType.Title}></TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center} waypoint={isWeekend(date)}>
      {cellItem === null ? "-" : <VarianceBadge delta={cellItem as number} />}
    </TableCell>
  );
