import React from "react";

interface Props {
  color?: string;
  textColor?: string;
}

const HalfHourIcon: React.FC<Props> = ({
  color = "currentColor",
  textColor = "black",
}) => (
  <svg
    viewBox="0 0 110 110"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <circle
      cx="55"
      cy="55"
      r="35"
      stroke="black"
      stroke-width="2"
      fill={color}
    />
    <circle
      transform="rotate(-90, 55, 55)"
      cx="55"
      cy="55"
      r="48"
      stroke={color}
      stroke-width="6"
      stroke-dasharray="280"
      fill="none"
    />
    <circle
      cx="55"
      cy="55"
      r="48"
      stroke={color}
      stroke-width="2"
      stroke-dasharray="6"
      fill="none"
    />
    <g transform="translate(26, 8.5) rotate(-28)">
      <line x1="0" y1="0" x2="8" y2="8" stroke={color} stroke-width="3px" />
      <line x1="8" y1="6" x2="0" y2="14" stroke={color} stroke-width="3px" />
    </g>
    <text
      x="34"
      y="64"
      font-weight="bold"
      font-size="30px"
      font-family="sans-serif"
      fill={textColor}
    >
      1H
    </text>
  </svg>
);

export default HalfHourIcon;
