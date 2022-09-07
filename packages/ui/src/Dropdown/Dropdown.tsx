import React from "react";

/** We're allowing dropdown option to get passed as label/value pair or as a string (in place of both those values) */
type DropdownOption = string | { label: string; value: string };
interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: DropdownOption[];
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  label,
  disabled = false,
  className,
  ...props
}) => (
  <>
    <label htmlFor={label} className="sr-only">
      {label}
    </label>
    <select
      id={label}
      name={label}
      autoComplete={label}
      disabled={disabled}
      className={[...dropdownClasses, className].join(" ")}
      {...props}
    >
      {options.map((opt) => {
        // If string, value is the same as label
        if (typeof opt === "string") return <option key={opt}>{opt}</option>;

        // If label/value object, render accordingly
        return (
          <option value={opt.value} key={opt.label}>
            {opt.label}
          </option>
        );
      })}
    </select>
  </>
);

const dropdownClasses = [
  "focus:ring-cyan-700",
  "focus:ring-2",
  "focus:border-none",
  "h-full",
  "py-0",
  "pl-3",
  "px-8",
  "text-center",
  "border-gray-300",
  "bg-transparent",
  "text-gray-500",
  "text-sm",
  "rounded-md",
  "cursor-pointer",
];

export default Dropdown;
