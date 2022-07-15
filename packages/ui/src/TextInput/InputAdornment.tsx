import React from "react";

interface IconAdornmentProps {
  Icon: any;
  position: "start" | "end";
}

interface AddOnAdornmentProps {
  label: string;
}

interface ButtonAdornmentProps extends React.HTMLAttributes<HTMLButtonElement> {
  Icon: any;
  label: string;
  disabled?: boolean;
}

interface DropdownAdornmentProps {
  name: string;
  options: string[];
  disabled?: boolean;
}

export const IconAdornment: React.FC<IconAdornmentProps> = ({
  Icon,
  position,
}) => {
  const padding = position === "start" ? "pl-3" : "pr-3";
  return (
    <div className={padding}>
      <div className="h-5 w-5 text-gray-400">
        <Icon />
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
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className="h-full -ml-px inline-flex items-center space-x-2 px-4 border-l-[1px] border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-700 focus:border-cyan-700"
  >
    <div className="h-5 w-5 text-gray-400" aria-hidden="true">
      <Icon />
    </div>
    <span>{label}</span>
  </button>
);

/*
  TODO: Pass Formik FieldProps to connect this dropdown's input to global Form State,
    or tie into field value? This action depends on use-case
*/
export const DropdownAdornment: React.FC<DropdownAdornmentProps> = ({
  name,
  options,
  disabled = false,
}) => (
  <>
    <label htmlFor={name} className="sr-only">
      Country
    </label>
    <select
      id={name}
      name={name}
      autoComplete={name}
      disabled={disabled}
      className="focus:ring-cyan-700 focus:border-cyan-700 h-full py-0 pl-3 px-8 border-transparent bg-transparent text-gray-500 text-sm rounded-md"
    >
      {options.map((opt) => (
        <option>{opt}</option>
      ))}
    </select>
  </>
);
