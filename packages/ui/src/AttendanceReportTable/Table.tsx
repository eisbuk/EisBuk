import React from "react";
import { DateTime } from "luxon";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import { Table, TableCell, CellType, CellTextAlign } from "../";
import VarianceBadge from "./VarianceBadge";
import {
  calculateDeltas,
  calculateTotals,
  collectDatesByHoursType,
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
              // TODO: add "waypoints for weekend dates"
              <TableCell
                type={CellType.Header}
                textAlign={
                  headers[key] !== StaticHeaders.Athletes
                    ? CellTextAlign.Center
                    : CellTextAlign.Left
                }
              >
                {headers[key]}
              </TableCell>
            ))}
          </tr>
        );
      }}
      renderRow={(rowItem, rowIx) => {
        const { type: rowType, ...data } = rowItem;
        const bgClasses = rowIx % 2 === 0 ? undefined : "bg-gray-50";
        const borderClasses =
          rowType === HoursType.Booked
            ? undefined
            : "border-b-[1px] border-gray-300";

        const rowClasses = [borderClasses, bgClasses].join(" ");

        // TODO: Cell Background also depends on if the rowItem key is a date string and "isWeekend" => Object.keys(rowItem)
        return (
          <tr key={rowIx} className={rowClasses}>
            {Object.values(data).map((cellItem, itemIx) =>
              rowType === HoursType.Booked ? (
                <BookedRowCells cellItem={cellItem} itemIx={itemIx} />
              ) : (
                <DeltaRowCells cellItem={cellItem} itemIx={itemIx} />
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
const BookedRowCells: React.FC<{
  cellItem: string | number | boolean | null;
  itemIx: number;
}> = ({ cellItem, itemIx }) =>
  itemIx === 0 ? (
    <TableCell type={CellType.Title}>{cellItem}</TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center}>
      <div>{cellItem === 0 ? "-" : `${cellItem}h`}</div>
    </TableCell>
  );

const DeltaRowCells: React.FC<{
  cellItem: string | number | boolean | null;
  itemIx: number;
}> = ({ cellItem, itemIx }) =>
  itemIx === 0 ? (
    <TableCell type={CellType.Title}></TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center}>
      {cellItem === null ? "-" : <VarianceBadge delta={cellItem as number} />}
    </TableCell>
  );
