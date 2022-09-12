import React from "react";

interface CellProps {
  textAlign?: CellTextAlign;
  type?: CellType;
}

const TableCell: React.FC<CellProps> = ({
  children,
  textAlign = CellTextAlign.Left,
  type = CellType.Data,
}) => {
  const as = type === CellType.Header ? "th" : "td";

  const className = [
    ...cellBaseClasses,
    ...typeClassLookup[type],
    ...textClassLookup[textAlign],
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
