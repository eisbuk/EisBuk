import { FieldProps } from "formik";
import React from "react";

/** We're allowing dropdown option to get passed as label/value pair or as a string (in place of both those values) */
export type DropdownOption = string | { label: string; value: string };
export interface DropdownProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: DropdownOption[];
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  disabled = false,
  className,
  name,
  ...props
}) => (
  <>
    <label htmlFor={name} className="sr-only">
      {name}
    </label>
    <select
      id={name}
      name={name}
      autoComplete={name}
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

export const FormikComponent: React.FC<FieldProps & DropdownProps> = ({
  field,
  ...props
}) => <Dropdown {...field} {...props} />;

export default Dropdown;
