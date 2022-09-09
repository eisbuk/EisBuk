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
  const as = CellType[type] === "header" ? "th" : "td";

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
  "text-sm",
];

const typeClassLookup = {
  [CellType.Data]: ["text-gray-500"],
  [CellType.Title]: ["text-gray-900", "font-medium"],
  [CellType.Header]: [
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
