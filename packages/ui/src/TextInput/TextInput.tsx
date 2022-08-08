import React from "react";
import { FieldProps } from "formik";

// Formik docs say that this is passed, but it isn't
type Field = Omit<FieldProps, "meta">;

// Without this, TS will complain that "form" on FieldProps & React.InputHTMLAttributes are not the same
type InputHTMLAttributes = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "form"
>;

export interface TextInputProps extends Field, InputHTMLAttributes {
  label: string;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  StartAdornment?: JSX.Element | null;
  EndAdornment?: JSX.Element | null;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  helpText,
  StartAdornment = null,
  EndAdornment = null,
  disabled = false,
  ...props
}) => {
  const { field, form, ...rest } = props;
  const { name } = field;
  const { touched, errors } = form;

  const hasValidationError = touched[name] && errors[name];

  const helpTextColour = hasValidationError ? "text-red-600" : "text-gray-500";
  const containerBorderWidth = disabled ? "outline-0" : "outline-1 shadow-sm";
  const containerBorderColour = hasValidationError
    ? "outline-red-600"
    : "outline-gray-300";

  const labelClasses = labelBaseClasses.join(" ");
  const inputClasses = inputBaseClasses.join(" ");
  const helpTextClasses = helpTextBaseClasses.concat(helpTextColour).join(" ");
  const containerClasses = containerBaseClasses
    .concat(containerBorderColour, containerBorderWidth)
    .join(" ");

  const supportContent = hasValidationError ? errors[name] : helpText;

  return (
    <div className="space-y-1">
      <label htmlFor={name} className={labelClasses}>
        {label}
      </label>
      <div className={containerClasses}>
        <div className="flex items-center mr-1">{StartAdornment}</div>
        <input
          type="text"
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...field}
          {...rest}
        />
        <div className="flex items-center ml-1">{EndAdornment}</div>
      </div>
      <p className={helpTextClasses}>{!disabled && supportContent}</p>
    </div>
  );
};

export default TextInput;

const labelBaseClasses = ["block", "text-sm", "font-medium", "text-gray-700"];
const helpTextBaseClasses = ["mt-2", "text-sm", "min-h-[20px]"];
const inputBaseClasses = [
  "block",
  "w-full",
  "rounded-md",
  "border-0",
  "text-sm",
  "focus:outline-0",
  "focus:ring-0",
];

// TODO: focus-within solution will also focus whole container when adornment button or dropdown are clicked
const containerBaseClasses = [
  "flex",
  "outline",
  "rounded-md",
  "focus-within:outline-2",
  "focus-within:outline-cyan-700",
];
