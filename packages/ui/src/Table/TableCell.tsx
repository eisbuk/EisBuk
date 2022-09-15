import React from "react";

interface CellProps extends React.TableHTMLAttributes<HTMLTableCellElement> {
  textAlign?: CellTextAlign;
  type?: CellType;
  isWaypoint?: boolean;
}

const TableCell: React.FC<CellProps> = ({
  children,
  textAlign = CellTextAlign.Left,
  type = CellType.Data,
  isWaypoint = false,
  className: classes,
}) => {
  const as = type === CellType.Header ? "th" : "td";

  const accentClasses = isWaypoint ? ["bg-gray-100"] : [];

  const className = [
    ...cellBaseClasses,
    ...typeClassLookup[type],
    ...textClassLookup[textAlign],
    ...accentClasses,
    classes,
  ].join(" ");

  return React.createElement(as, { className }, [children]);
};

export enum CellType {
  Data = "data",
  Title = "title",
  Header = "header",
}

export enum CellTextAlign {
  Left = "left",
  Right = "right",
  Center = "center",
}

const cellBaseClasses = [
  "border-r-[1px]",
  "border-gray-200",
  "whitespace-nowrap",
  "px-3",
  "py-4",
  "sm:text-sm",
  "text-xs",
  "align-top",
];

const typeClassLookup = {
  [CellType.Data]: ["text-gray-500"],
  [CellType.Title]: ["text-gray-900", "font-medium"],
  [CellType.Header]: [
    "sticky",
    "top-0",
    "z-10",
    "bg-opacity-75",
    "backdrop-blur",
    "backdrop-filter",
    "border-b",
    "border-gray-300",
    "text-gray-500",
    "font-medium",
    "tracking-wide",
    "uppercase",
  ],
};

const textClassLookup = {
  [CellTextAlign.Left]: ["text-left"],
  [CellTextAlign.Center]: ["text-center"],
  [CellTextAlign.Right]: ["text-right"],
};

export default TableCell;
