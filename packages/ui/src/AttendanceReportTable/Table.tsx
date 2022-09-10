import React from "react";

import { Table, TableCell, CellType, CellTextAlign } from "../";
import VarianceBadge from "./VarianceBadge";

export enum DataType {
  Booked = "booked",
  Delta = "delta",
}

interface Data {
  athlete: string;
  booked: {
    // TODO: Stricter date string match? and *
    [dateStr: string]: number;
    total: number;
  };
  delta: {
    // TODO: *
    [dateStr: string]: number;
    total: number;
  };
}

interface TableProps {
  dates: string[];
  data: Data[];
}

interface RowItem {
  athlete: string;
  [dateStr: string]: string | number;
  total: number;
  type: DataType;
}

const AttendanceReportTable: React.FC<TableProps> = ({ dates, data }) => {
  // TODO: Do bottom two need to be run as useState, useEffect? If you want to remount component when dates or data are passed in
  // Answer, no: but a controlling component / page should

  // TODO: Function to return `Date, Day` from passed in ISO date string
  const dateHeaders = dates.reduce((acc, curDate) => {
    acc[curDate] = "Date, Day";
    return acc;
  }, {});

  const items = data.reduce<RowItem[]>((acc, { athlete, booked, delta }) => {
    // TODO: this will be incomplete: need to spread all dates within range over object,
    // try to access values from athlete.booked|delta[dateStr], or mark as zero if no access
    // TODO: Should you also just calculate Delta in this component / Util function (that is also exported) - so data coming in is "booked" | "atended"
    // You could probably just store these as an array on the same day?

    // Note that this should always create alternating rows for the same athlete
    const athleteBooked = { type: DataType.Booked, athlete, ...booked };
    const athleteDelta = { type: DataType.Delta, athlete, ...delta };

    return [athleteBooked, athleteDelta, ...acc];
  }, []);

  return (
    <Table
      // TODO: header strings require translations
      headers={{
        athlete: "Athletes",
        ...dateHeaders,
        total: "Total",
      }}
      items={items}
      renderHeaders={(headers) => {
        return (
          <tr>
            {Object.keys(headers).map((key) =>
              // TODO: add "waypoints for weekend dates"
              key === "athlete" || key === "total" ? (
                <TableCell type={CellType.Header}>{headers[key]}</TableCell>
              ) : (
                // TODO: Render the date header string differently
                <TableCell type={CellType.Header}>{headers[key]}</TableCell>
              )
            )}
          </tr>
        );
      }}
      renderRow={(rowItem, rowIx) => {
        const bgClasses = rowIx % 2 === 0 ? undefined : "bg-gray-50";
        const borderClasses =
          rowItem.type === DataType.Booked ? undefined : "border-b-[1px]";

        const rowClasses = [borderClasses, bgClasses].join(" ");

        // TODO: Cell Background also depends on if the rowItem key is a date string and "isWeekend"
        // Object.keys(rowItem)

        return (
          <tr key={rowIx} className={rowClasses}>
            {Object.values(rowItem).map((cellItem, itemIx) =>
              rowItem.type === DataType.Booked ? (
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
  cellItem: string | number;
  itemIx: number;
}> = ({ cellItem, itemIx }) => {
  const numberContent = (num: number) => (num === 0 ? "-" : `${num}h`);
  return itemIx === 0 ? (
    <TableCell type={CellType.Title}>{cellItem}</TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center}>
      <div>{numberContent(cellItem)}</div>
    </TableCell>
  );
};

const DeltaRowCells: React.FC<{
  cellItem: string | number;
  itemIx: number;
}> = ({ cellItem, itemIx }) => {
  return itemIx === 0 ? (
    <TableCell type={CellType.Title}>""</TableCell>
  ) : (
    <TableCell textAlign={CellTextAlign.Center}>
      <VarianceBadge delta={cellItem} />
    </TableCell>
  );
};
