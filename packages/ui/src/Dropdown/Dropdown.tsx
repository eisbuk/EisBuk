import { FieldProps } from "formik";
import React from "react";

import { ConditionalWrapper } from "../utils/components";

/** We're allowing dropdown option to get passed as label/value pair or as a string (in place of both those values) */
export type DropdownOption = string | { label: string; value: string };
export interface DropdownProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: DropdownOption[];
  label?: string;
  disabled?: boolean;
  StartAdornment?: JSX.Element;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  disabled = false,
  className,
  name,
  label,
  StartAdornment = null,
  ...props
}) => {
  const hasLabel = Boolean(label);

  // If the label is provided, we want to render the component as a block
  // featuring a (visual) label and the dropdown
  //
  // If not, we're rendering the dropdown as an element which can be embeded in
  // composite fields (e.g. PhoneInput)
  const labelWrapper: React.FC = ({ children }) => (
    <div className={["h-full", className].join(" ")}>{children}</div>
  );

  return (
    <ConditionalWrapper shouldWrap={hasLabel} Wrapper={labelWrapper}>
      <label
        htmlFor={name}
        // If no explicit `label` is provided, the `name` is used as a label
        // and is rendered "invisibly" (only for crawlers and screen readers)
        className={hasLabel ? visualLabelClasses.join(" ") : "sr-only"}
      >
        {label || name}
      </label>
      <div className="relative">
        {StartAdornment && (
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-5 h-5">
            {StartAdornment}
          </div>
        )}
        <select
          id={name}
          name={name}
          autoComplete={name}
          disabled={disabled}
          className={[
            ...dropdownClasses,
            StartAdornment ? "pl-7" : "pl-3",
            ...(!hasLabel ? ["h-full", className] : ["h-8"]),
          ].join(" ")}
          {...props}
        >
          {options.map((opt) => {
            // If string, value is the same as label
            if (typeof opt === "string") {
              return <option key={opt}>{opt}</option>;
            }

            // If label/value object, render accordingly
            return (
              <option value={opt.value} key={opt.label}>
                {opt.label}
              </option>
            );
          })}
        </select>
      </div>
    </ConditionalWrapper>
  );
};

const visualLabelClasses = [
  "block",
  "mb-1",
  "text-sm",
  "font-medium",
  "text-gray-700",
];

const dropdownClasses = [
  "focus:ring-cyan-700",
  "focus:ring-2",
  "focus:border-none",
  "py-0",
  "px-8",
  "text-center",
  "border-gray-300",
  "bg-transparent",
  "text-gray-500",
  "text-sm",
  "rounded-md",
  "cursor-pointer",
];

export const FormikComponent: React.FC<
  Pick<FieldProps, "field"> & DropdownProps
> = ({ field, ...props }) => <Dropdown {...field} {...props} />;

export default Dropdown;
