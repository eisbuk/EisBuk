import React, { useMemo } from "react";
import { v4 as uuid } from "uuid";

interface Props {
  color?: string;
  textColor?: string;
}

const HalfHourIcon: React.FC<Props> = ({
  color = "currentColor",
  textColor = "black",
}) => {
  // we're creating a unique id for gradient reference
  // to scope the definition to an instance of the component
  const gradientId = useMemo(() => uuid(), []);

  return (
    <svg
      viewBox="0 0 110 110"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient id={gradientId} gradientTransform="rotate(0)">
          <stop offset="20%" stopColor="white" />
          <stop offset="80%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle
        cx="55"
        cy="55"
        r="35"
        stroke="black"
        strokeWidth="2"
        fill={`url('#${gradientId}')`}
      />
      <circle
        transform="rotate(-90, 55, 55)"
        cx="55"
        cy="55"
        r="48"
        stroke={color}
        strokeWidth="6"
        strokeDasharray="150"
        fill="none"
      />
      <circle
        cx="55"
        cy="55"
        r="48"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="6"
        fill="none"
      />
      <g transform="translate(60, 110) rotate(-180)">
        <line x1="0" y1="0" x2="8" y2="8" stroke={color} strokeWidth="3px" />
        <line x1="8" y1="6" x2="0" y2="14" stroke={color} strokeWidth="3px" />
      </g>
      <text
        x="31"
        y="65"
        fontWeight="bold"
        fontSize="30px"
        fontFamily="sans-serif"
        fill={textColor}
      >
        ½H
      </text>
    </svg>
  );
};

export default HalfHourIcon;
