import React from "react";

interface IconAdornmentProps {
  Icon: JSX.Element | null;
  position: "start" | "end";
  disabled?: boolean;
}

interface AddOnAdornmentProps {
  label: string;
}

interface ButtonAdornmentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  Icon: JSX.Element | null;
  label: string;
  disabled?: boolean;
}

interface DropdownAdornmentProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  disabled?: boolean;
}

export const IconAdornment: React.FC<IconAdornmentProps> = ({
  Icon,
  position,
  disabled = false,
}) => {
  const padding = position === "start" ? "pl-3" : "pr-3";
  const colour = disabled ? "text-cyan-700" : "text-gray-400";

  return (
    <div className={padding}>
      <div className={`h-5 w-5 ${colour}`} aria-hidden="true">
        {Icon}
      </div>
    </div>
  );
};

export const AddOnAdornment: React.FC<AddOnAdornmentProps> = ({ label }) => (
  <span className="h-full inline-flex items-center px-3 rounded-l-md border-r-[1px] border-gray-300 bg-gray-50 text-gray-500 text-sm">
    {label}
  </span>
);

export const ButtonAdornment: React.FC<ButtonAdornmentProps> = ({
  Icon,
  label,
  onClick = () => {},
  disabled = false,
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className="h-full -ml-px inline-flex items-center space-x-2 px-4 border-l-[1px] border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-700 focus:border-cyan-700"
    {...props}
  >
    <div className="h-5 w-5 text-gray-400" aria-hidden="true">
      {Icon}
    </div>
    <span>{label}</span>
  </button>
);

// TODO: Pass Formik FieldProps to connect this dropdown's input to global Form State as separate field value, or combine with TextInput field value?
export const DropdownAdornment: React.FC<DropdownAdornmentProps> = ({
  options,
  label,
  disabled = false,
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
      className="focus:ring-cyan-700 focus:border-cyan-700 h-full py-0 pl-3 px-8 border-transparent bg-transparent text-gray-500 text-sm rounded-md"
      {...props}
    >
      {options.map((opt) => (
        <option>{opt}</option>
      ))}
    </select>
  </>
);
