import React from "react";
import { FieldProps } from "formik";

// Without this, TS will complain that "form" on FieldProps & React.InputHTMLAttributes are not the same
type InputHTMLAttributes = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "form"
>;

export interface TextInputProps extends InputHTMLAttributes {
  label: string;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  containerClassName?: string;
  inputClassName?: string;
  StartAdornment?: JSX.Element | null;
  EndAdornment?: JSX.Element | null;
  innerRef?: React.RefObject<HTMLInputElement>;
  /**
   * `error` prop is here in case we want to explicitly invelidate the field from the caller.
   * This is convenient in cases we want to invalidate (and color red) multiple text inputs
   * beause of some higher order error.
   */
  error?: boolean;
}
export type TextInputFieldProps = Omit<FieldProps, "meta"> & TextInputProps;

const TextInput: React.FC<TextInputFieldProps> = ({
  label,
  placeholder,
  helpText,
  StartAdornment,
  EndAdornment,
  disabled = false,
  multiline,
  rows = 2,
  className = "",
  containerClassName = "",
  inputClassName = "",
  error = false,
  // We sometimes use the innerRef through Formik's FieldProps,
  // but then that innerRef gets passed along to this component. This
  // way, we're making sure it doesn't end up in the DOM element (thus avoiding React warning)
  //
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  innerRef,
  ...props
}) => {
  const { field, form, ...rest } = props;
  const { name } = field;
  const { touched, errors } = form;

  const hasValidationError = (touched[name] && errors[name]) || error;

  const helpTextColour = hasValidationError ? "text-red-600" : "text-gray-500";
  const containerBorderWidth = disabled ? "outline-0" : "outline-1 shadow-sm";
  const containerBorderColour = hasValidationError
    ? "outline-red-600"
    : "outline-gray-300";

  const labelClasses = labelBaseClasses.join(" ");
  const inputClasses = inputBaseClasses.concat(inputClassName).join(" ");
  const helpTextClasses = helpTextBaseClasses.concat(helpTextColour).join(" ");
  const containerClasses = containerBaseClasses
    .concat(containerBorderColour, containerBorderWidth, containerClassName)
    .join(" ");

  const supportContent = hasValidationError ? errors[name] : helpText;

  const inputElement = multiline ? "textarea" : "input";

  const adornmentClasses = `flex mr-1 ${
    multiline ? "items-start my-3" : "items-center"
  }`;

  return (
    <div className={["space-y-1", className].join(" ")}>
      <label htmlFor={name} className={labelClasses}>
        {label}
      </label>
      <div className={containerClasses}>
        {StartAdornment && (
          <div key="startAdornment" className={adornmentClasses}>
            {StartAdornment}
          </div>
        )}

        {React.createElement(inputElement, {
          key: "inputElement",
          type: "text",
          id: name,
          placeholder: placeholder,
          disabled: disabled,
          className: inputClasses,
          rows,
          ...field,
          ...rest,
        })}

        {EndAdornment && (
          <div key="endEdornment" className={adornmentClasses}>
            {EndAdornment}
          </div>
        )}
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
  "border-0",
  "text-sm",
  "focus:outline-0",
  "focus:ring-0",
  "resize-none",
];

// TODO: focus-within solution will also focus whole container when adornment button or dropdown are clicked
const containerBaseClasses = [
  "flex",
  "outline",
  "rounded-md",
  "focus-within:outline-2",
  "focus-within:outline-cyan-700",
];
