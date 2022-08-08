import React from "react";
import { FieldProps } from "formik";

interface CheckboxProps extends FieldProps {
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
        <label htmlFor={name} className="font-medium text-gray-700">
          {label}
        </label>
        <p id="comments-description" className="text-gray-500">
          {helpText}
        </p>
      </div>
    </div>
  );
};

export default Checkbox;
