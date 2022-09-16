import { FieldProps } from "formik";
import React from "react";

import Dropdown, { DropdownProps } from "../Dropdown";
import { dialCodeOptions } from "./utils";

type CountryCodesProps = Omit<DropdownProps, "options">;

const CountryCodesDropdown: React.FC<CountryCodesProps> = ({
  value: v,
  ...props
}) => {
  const options = dialCodeOptions;

  const value = v || options[0].value;

  return <Dropdown value={value} {...props} options={options} />;
};

export const FormikComponent: React.FC<
  CountryCodesProps & Pick<FieldProps, "field">
> = ({ field, ...props }) => <CountryCodesDropdown {...field} {...props} />;

export default CountryCodesDropdown;
