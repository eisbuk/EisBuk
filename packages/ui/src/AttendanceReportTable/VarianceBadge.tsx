import React from "react";

import { CheckCircle } from "@eisbuk/svg";

interface VarianceBadgeProps {
  delta: number;
}

enum Variance {
  Zero = "zero",
  Positive = "positive",
  Negative = "negative",
}

const VarianceBadge: React.FC<VarianceBadgeProps> = ({ delta }) => {
  const varianceType =
    delta === 0
      ? Variance.Zero
      : delta < 0
      ? Variance.Negative
      : Variance.Positive;

  const classes = [...badgeBaseClasses, ...colorClassLookup[varianceType]].join(
    " "
  );

  return (
    <span className={classes}>
      {!delta ? (
        <span className="sm:h-6 sm:w-6 h-5 w-5">
          <CheckCircle />
        </span>
      ) : (
        delta.toLocaleString("en-US", {
          signDisplay: "always",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      )}
    </span>
  );
};

const badgeBaseClasses = [
  "inline-flex",
  "items-center",
  "justify-center",
  "rounded-md",
  "px-1.5",
  "sm:text-sm",
  "text-xs",
  "tracking-wide",
  "font-normal",
];

const colorClassLookup = {
  [Variance.Zero]: ["text-green-300"],
  [Variance.Negative]: ["bg-yellow-100", "text-yellow-800"],
  [Variance.Positive]: ["bg-red-100", "text-red-800"],
};

export default VarianceBadge;
