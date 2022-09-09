import React from "react";

import TableCell, { CellType } from "./TableCell";

type TableItem = Record<string, string | number | boolean>;
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
}: React.PropsWithChildren<TableProps<T>>) => {
  return (
    <div className="flex flex-col">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table
              className="min-w-full divide-y divide-gray-300 table-auto border-separate"
              style={{ borderSpacing: 0 }}
            >
              <thead className="bg-gray-50">{renderHeaders(headers)}</thead>
              <tbody className="bg-white">{items.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const defaultRenderRow: RenderRow = (item, rowIx, itemArr) => {
  const bgClasses = rowIx % 2 === 0 ? undefined : "bg-gray-50";
  const borderClasses =
    rowIx === itemArr.length - 1 ? undefined : "border-b-[1px]";

  const rowClasses = [borderClasses, bgClasses].join(" ");

  return (
    <tr key={rowIx} className={rowClasses}>
      {Object.values(item).map((itemValue, itemIx) =>
        itemIx === 0 ? (
          <TableCell type={CellType.Title}>{itemValue}</TableCell>
        ) : (
          <TableCell>{itemValue}</TableCell>
        )
      )}
    </tr>
  );
};

const defaultRenderHeaders: RenderHeaders = (headers) => {
  return (
    <tr>
      {Object.values(headers).map((headerValue) => (
        <TableCell type={CellType.Header}>{headerValue}</TableCell>
      ))}
    </tr>
  );
};

export default Table;
