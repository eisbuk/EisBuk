import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import { FieldProps } from "formik";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helpText?: string;
  disabled?: boolean;
}
type CheckboxFieldProps = CheckboxProps & Pick<FieldProps, "field">;

const Checkbox: React.FC<CheckboxFieldProps> = ({
  label,
  helpText,
  disabled,
  field,
  className = "",
  value,
  ...props
}) => {
  const { name, value: fieldValue, checked: fieldChecked } = field;

  // We need to generate an id for the label to work
  const [controlId] = useState(uuid);

  // Check if checkbox is standalone or part of fieldsed.
  // If part of fieldset, the value will be an array
  const checked = Array.isArray(fieldValue)
    ? // If part of fieldset, we check to see if the field is
      // 'checked' by it being included in array of values
      fieldValue.includes(value)
    : // If the checkbox is standalone, checked property will
      // be correctly passed
      fieldChecked;

  const labelClasses = [
    "font-medium",
    disabled ? "text-gray-400" : "text-gray-700",
  ];
  const helpTextColor = disabled ? "text-gray-300" : "text-gray-500";

  return (
    <div className={["relative flex items-start", className].join(" ")}>
      <div className="flex items-center h-5">
        <input
          {...field}
          {...props}
          id={controlId}
          disabled={disabled}
          aria-describedby="comments-description"
          type="checkbox"
          className="focus:ring-cyan-700 h-4 w-4 text-gray-800 border-gray-300 rounded disabled:text-gray-200"
          value={value}
          checked={checked}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={controlId} className={labelClasses.join(" ")}>
          {label}
        </label>
        <p id={`comments-description-${name}`} className={helpTextColor}>
          {helpText}
        </p>
      </div>
    </div>
  );
};

export default Checkbox;
