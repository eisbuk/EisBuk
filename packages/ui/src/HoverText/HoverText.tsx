import React from "react";

interface HoverTextProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  text: string;
  multiline?: "sm" | "md" | "lg" | false;
}

const HoverText: React.FC<HoverTextProps> = ({
  className,
  children,
  text,
  multiline = false,
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

      <div
        className={`absolute z-40 left-1/2 bottom-1/2 overflow-hidden hover-element ${
          multiline ? multilineWidthLookup[multiline] : "whitespace-nowrap"
        }`}
      >
        <div className="inline-block bg-gray-200 border-gray-300 max-w-full">
          <span className="py-0.5 px-1 inline-block text-xs text-gray-900 border select-none cursor-normal">
            {text}
          </span>
        </div>
      </div>
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

const multilineWidthLookup = {
  sm: "w-[300px]",
  md: "w-[400px]",
  lg: "w-[500px]",
};

export default HoverText;
