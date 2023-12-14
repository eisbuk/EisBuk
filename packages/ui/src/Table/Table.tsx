import React from "react";

import TableCell, { CellType } from "./TableCell";

type TableItem = Record<string, string | number | boolean | null>;
type TableHeaders<T> = Record<keyof T, string>;

interface RenderRow<T extends TableItem = TableItem> {
  (item: T, rowIx: number, itemArr: T[]): JSX.Element;
}

interface RenderHeaders<T extends TableItem = TableItem> {
  (headers: TableHeaders<T>): JSX.Element;
}

interface TableProps<T extends TableItem> {
  headers: TableHeaders<T>;
  items: T[];
  renderRow?: RenderRow<T>;
  renderHeaders?: RenderHeaders<T>;
}

/**
 * Generic simple Table component
 */
const Table = <T extends TableItem>({
  headers,
  items,
  renderRow = defaultRenderRow,
  renderHeaders = defaultRenderHeaders,
}: React.PropsWithChildren<TableProps<T>>) => (
  <table
    className="min-w-full max-w-full w-full divide-y divide-gray-300 table-auto border-separate"
    style={{ borderSpacing: 0 }}
  >
    <thead className="bg-white">{renderHeaders(headers)}</thead>
    <tbody className="bg-gray-50">{items.map(renderRow)}</tbody>
  </table>
);

const defaultRenderRow: RenderRow = (item, rowIx, itemArr) => {
  const bgClasses = rowIx % 2 === 0 ? undefined : "bg-gray-50";
  const borderClasses =
    rowIx === itemArr.length - 1 ? undefined : "border-b-[1px]";

  const rowClasses = [borderClasses, bgClasses].join(" ");

  return (
    <tr key={rowIx} className={rowClasses}>
      {Object.values(item).map((itemValue, itemIx) =>
        itemIx === 0 ? (
          <TableCell key={`${itemValue}-${itemIx}`} type={CellType.Title}>
            {itemValue}
          </TableCell>
        ) : (
          <TableCell key={`${itemValue}-${itemIx}`}>{itemValue}</TableCell>
        )
      )}
    </tr>
  );
};

const defaultRenderHeaders: RenderHeaders = (headers) => {
  return (
    <tr>
      {Object.values(headers).map((headerValue, i) => (
        <TableCell key={`${headerValue}-${i}`} type={CellType.Header}>
          {headerValue}
        </TableCell>
      ))}
    </tr>
  );
};

export default Table;
