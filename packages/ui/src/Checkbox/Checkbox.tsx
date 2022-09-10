import React from "react";
import { FieldProps } from "formik";

// Formik docs say that this is passed, but it isn't
type Field = Omit<FieldProps, "meta">;

interface CheckboxProps extends Field {
  label: string;
  helpText?: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helpText,
  disabled,
  ...props
}) => {
  const { field } = props;
  const { name } = field;

  const labelClasses = [
    "font-medium",
    disabled ? "text-gray-400" : "text-gray-700",
  ];
  const helpTextColor = disabled ? "text-gray-300" : "text-gray-500";

  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          id={name}
          disabled={disabled}
          aria-describedby="comments-description"
          type="checkbox"
          className="focus:ring-cyan-700 h-4 w-4 text-gray-800 border-gray-300 rounded disabled:text-gray-200"
          {...field}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={name} className={labelClasses.join(" ")}>
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
