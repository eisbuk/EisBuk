import React from "react";
import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";

import i18n, {
  useTranslation,
  CustomerLabel,
  ValidationMessage,
} from "@eisbuk/translations";
import { ExclamationCircle } from "@eisbuk/svg";

import FormSection from "../FormSection";
import FormField, { FormFieldVariant, FormFieldWitdh } from "../FormField";

export interface RegistrationCodeFields {
  registrationCode: string;
}

interface SectionProps {
  disabled?: boolean;
  disabledFields?: Array<keyof RegistrationCodeFields>;
}

const SectionRegistrationCode: React.FC<SectionProps> = (contextProps) => {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t(CustomerLabel.RegistrationCode)}
      subtitle={t(CustomerLabel.InputRegistrationCode)}
      {...contextProps}
    >
      <FormField
        name="registrationCode"
        variant={FormFieldVariant.Text}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.RegistrationCode)}
        Icon={ExclamationCircle}
      />
    </FormSection>
  );
};

export const registrationCodeInitialValues: RegistrationCodeFields = {
  registrationCode: "",
};

export const registrationCodeValidations: ObjectShape = {
  registrationCode: Yup.string().required(
    i18n.t(ValidationMessage.RequiredField)
  ),
};

export default SectionRegistrationCode;
