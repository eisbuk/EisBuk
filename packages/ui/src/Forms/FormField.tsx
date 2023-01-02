import React from "react";
import { Field } from "formik";

import TextInput, { TextInputProps as TIP, IconAdornment } from "../TextInput";
import DateInput from "../DateInput";
import Checkbox, { CheckboxProps as CBP } from "../Checkbox";
import PhoneInput, { PhoneInputProps as PIP } from "../PhoneInput";

import { FormSectionContext } from "./FormSection";

export enum FormFieldVariant {
  Text = "text",
  Date = "date",
  Phone = "phone",
  Checkbox = "checkbox",
}

export enum FormFieldWitdh {
  SM = "col-span-3",
  MD = "col-span-4",
  Full = "col-span-6",
}

interface BaseProps {
  label: string;
  helpText?: string;
  Icon?: React.FC;
  width?: FormFieldWitdh;
  disabled?: boolean;
}

interface TextInputProps extends BaseProps, Omit<TIP, "width"> {
  variant: FormFieldVariant.Text;
}
interface DateInputProps extends BaseProps, Omit<TIP, "width"> {
  variant: FormFieldVariant.Date;
}
interface PhoneInputProps extends BaseProps, Omit<PIP, "width"> {
  variant: FormFieldVariant.Phone;
}
interface CheckboxProps extends BaseProps, Omit<CBP, "width"> {
  variant: FormFieldVariant.Checkbox;
}
type FormFieldProps =
  | TextInputProps
  | DateInputProps
  | PhoneInputProps
  | CheckboxProps;

const FormField: React.FC<FormFieldProps> = ({
  name = "",
  label,
  variant,
  helpText,
  Icon,
  width = FormFieldWitdh.SM,
  disabled: propsDisabled,
  ...props
}) => {
  // Load form section context
  const { disabled: sectionDisabled, disabledFields = [] } =
    React.useContext(FormSectionContext);

  // The field can be disabled if so explicitly stated, if the section is disabled
  // or if the field is in the list of disabled fields
  const disabled =
    propsDisabled || sectionDisabled || disabledFields.includes(name);

  return (
    <div className={width}>
      <Field
        name={name}
        label={label}
        component={componentLookup[variant]}
        type={typeLookup[variant]}
        StartAdornment={
          Icon && (
            <IconAdornment
              Icon={<Icon />}
              position="start"
              disabled={disabled}
            />
          )
        }
        disabled={disabled}
        helpText={helpText}
        defauldDialCode={(props as PhoneInputProps).defaultDialCode}
      />
    </div>
  );
};

const componentLookup = {
  [FormFieldVariant.Text]: TextInput,
  [FormFieldVariant.Date]: DateInput,
  [FormFieldVariant.Phone]: PhoneInput,
  [FormFieldVariant.Checkbox]: Checkbox,
};

const typeLookup = {
  [FormFieldVariant.Text]: "text",
  [FormFieldVariant.Date]: "text",
  [FormFieldVariant.Phone]: "tel",
  [FormFieldVariant.Checkbox]: "checkbox",
};

export default FormField;
