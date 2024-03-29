import React from "react";
import { Field } from "formik";

import { SVGComponent } from "@eisbuk/svg";

import TextInput, { TextInputProps as TIP, IconAdornment } from "../TextInput";
import DateInput from "../DateInput";
import Checkbox, { CheckboxProps as CBP } from "../Checkbox";
import PhoneInput, { PhoneInputProps as PIP } from "../PhoneInput";

import { FormSectionContext } from "./FormSection";

export enum FormFieldVariant {
  Text = "text",
  Number = "number",
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
  Icon?: SVGComponent;
  width?: FormFieldWitdh;
  disabled?: boolean;
  innerRef?: React.RefObject<HTMLInputElement>;
}

interface TextInputProps extends BaseProps, Omit<TIP, "width"> {
  variant: FormFieldVariant.Text;
}
interface NumberInputProps extends BaseProps, Omit<TIP, "width"> {
  variant: FormFieldVariant.Number;
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
  | CheckboxProps
  | NumberInputProps;

const FormField: React.FC<FormFieldProps> = ({
  name = "",
  label,
  variant,
  Icon,
  width = FormFieldWitdh.SM,
  disabled: propsDisabled,
  innerRef,
  ...props
}) => {
  // Load form section context
  const { disabled: sectionDisabled, disabledFields = [] } =
    React.useContext(FormSectionContext);

  // The field can be disabled if so explicitly stated, if the section is disabled
  // or if the field is in the list of disabled fields
  const disabled =
    propsDisabled || sectionDisabled || disabledFields.includes(name);

  // We're optionally adding these props (if they're defined) as we
  // don't want to get: "React doesn't recognize the following props on a DOM element" error
  const additionalProps = {
    ...(Icon && {
      StartAdornment: (
        <IconAdornment Icon={Icon} position="start" disabled={disabled} />
      ),
    }),
  };

  return (
    <div className={width}>
      <Field
        {...props}
        {...additionalProps}
        name={name}
        label={label}
        component={componentLookup[variant]}
        type={typeLookup[variant]}
        disabled={disabled}
        innerRef={innerRef}
      />
    </div>
  );
};

const componentLookup = {
  [FormFieldVariant.Text]: TextInput,
  [FormFieldVariant.Number]: TextInput,
  [FormFieldVariant.Date]: DateInput,
  [FormFieldVariant.Phone]: PhoneInput,
  [FormFieldVariant.Checkbox]: Checkbox,
};

const typeLookup = {
  [FormFieldVariant.Text]: "text",
  [FormFieldVariant.Number]: "number",
  [FormFieldVariant.Date]: "text",
  [FormFieldVariant.Phone]: "tel",
  [FormFieldVariant.Checkbox]: "checkbox",
};

export default FormField;
