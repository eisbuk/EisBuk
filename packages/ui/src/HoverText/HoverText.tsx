import React from "react";

interface HoverTextProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  text: string;
}

const HoverText: React.FC<HoverTextProps> = ({
  className,
  children,
  text,
  ...props
}) => {
  const inputClasses = className?.split(" ") || [];
  const finalClasses = applyRelativePositioning([
    "inline-block",
    ...inputClasses,
  ]).join(" ");

  return (
    <div className={[finalClasses, "hover-container"].join(" ")} {...props}>
      {children}

      <span className={[...hoverTextClasses, "hover-element"].join(" ")}>
        {text}
      </span>
    </div>
  );
};

const applyRelativePositioning = (inputClasses: string[]): string[] => {
  const relativeClasses = ["absolute", "relative", "fixed", "sticky"];
  let hasRelativeClass = false;
  let hasStaticClass = false;

  for (const c of inputClasses) {
    if (relativeClasses.includes(c)) {
      hasRelativeClass = true;
    }
    if (c === "static") {
      console.warn(
        `Illegal positioning "static" applied to the component. This component needs one of the relative-like positioning: ${relativeClasses.toString()}`
      );
      hasStaticClass = true;
    }
  }

  const noStaticClasses = !hasStaticClass
    ? inputClasses
    : inputClasses.filter((c) => c !== "static");

  return hasRelativeClass
    ? noStaticClasses
    : noStaticClasses.concat("relative");
};

const hoverTextClasses = [
  "absolute",
  "z-40",
  "left-1/2",
  "bottom-1/2",
  "py-0.5",
  "px-1",
  "bg-gray-200",
  "text-xs",
  "text-gray-900",
  "whitespace-nowrap",
  "border",
  "border-gray-300",
  "select-none",
  "cursor-normal",
];

export default HoverText;
