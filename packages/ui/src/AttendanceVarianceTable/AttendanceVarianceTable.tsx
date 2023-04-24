import React from "react";
import { DateTime } from "luxon";

import {
  useTranslation,
  DateFormat,
  AttendanceVarianceHeaders,
} from "@eisbuk/translations";

import Table, { TableCell, CellType, CellTextAlign } from "../Table";
import VarianceBadge from "./VarianceBadge";
import {
  padEmptyDates,
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

export interface DayAttendanceHours {
  [dateStr: string]: HoursTuple;
}

export interface TableData {
  athlete: string;
  hours: DayAttendanceHours;
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
  date: string;
  itemIx: number;
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

  const items = getTableItems(dates, data);

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
                const { type: rowType, ...data } = rowItem;

                const rowClasses = rowIx % 2 === 0 ? undefined : "bg-white";
                const cellClasses =
                  rowIx === itemArr.length - 1 ? undefined : "border-b-2";

                return (
                  <tr key={rowIx} className={rowClasses}>
                    {Object.entries(data).map(([date, cellItem], itemIx) =>
                      rowType === HoursType.Booked ? (
                        <BookedRowCells
                          key={`${date}-${cellItem}`}
                          cellItem={cellItem}
                          itemIx={itemIx}
                          date={date}
                        />
                      ) : (
                        <DeltaRowCells
                          key={`${date}-${cellItem}`}
                          cellItem={cellItem}
                          itemIx={itemIx}
                          date={date}
                          classes={cellClasses}
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

const getTableItems = (dates: string[], data: TableData[]) => {
  return data.reduce<RowItem[]>((acc, { athlete, hours: _hours }) => {
    const hours = padEmptyDates(dates, _hours);
    const hoursWithDeltas = calculateDeltas(hours);

    const [totalBooked, , totalDelta] = calculateTotals(hoursWithDeltas);
    const { booked, delta } = collectDatesByHoursType(hoursWithDeltas);

    const athleteBooked: RowItem = {
      type: HoursType.Booked,
      athlete,
      ...booked,
      total: totalBooked,
    };
    const athleteDelta: RowItem = {
      type: HoursType.Delta,
      athlete,
      ...delta,
      total: totalDelta,
    };

    // Note: Returns alternating Booked-Delta rows for each athlete
    return [athleteBooked, athleteDelta, ...acc];
  }, []);
};

const BookedRowCells: React.FC<RowContent> = ({ cellItem, itemIx, date }) =>
  itemIx === 0 ? (
    <TableCell type={CellType.Title} className={stickyCellClasses.join(" ")}>
      <p className="inline-block w-32 truncate ...">
        {cellItem}
        <span className="sr-only">{HoursType.Booked}</span>
      </p>
    </TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center} isWaypoint={isWeekend(date)}>
      <p className="leading-6">{cellItem === 0 ? "-" : `${cellItem}h`}</p>
    </TableCell>
  );

const DeltaRowCells: React.FC<RowContent> = ({
  cellItem,
  itemIx,
  date,
  classes,
}) =>
  itemIx === 0 ? (
    <TableCell
      type={CellType.Title}
      className={`${classes} ${stickyCellClasses.join(" ")}`}
    >
      <p className="sr-only">{`${cellItem} ${HoursType.Delta}`}</p>
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
