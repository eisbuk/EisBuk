import React from "react";
import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";

import i18n, {
  useTranslation,
  CustomerLabel,
  ValidationMessage,
} from "@eisbuk/translations";
import { ClipboardList } from "@eisbuk/svg";

import FormSection from "../FormSection";
import FormField, { FormFieldVariant, FormFieldWitdh } from "../FormField";

import { isISODay } from "../../utils/date";

export interface MedicalDetailsFields {
  certificateExpiration: string;
}

interface SectionProps {
  disabled?: boolean;
  disabledFields?: Array<keyof MedicalDetailsFields>;
}

const SectionMedicalDetails: React.FC<SectionProps> = (contextProps) => {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t(CustomerLabel.MedicalDetails)}
      subtitle={t(CustomerLabel.ManageMedicalDetails)}
      {...contextProps}
    >
      <FormField
        name="certificateExpiration"
        variant={FormFieldVariant.Date}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.CertificateExpiration)}
        Icon={ClipboardList}
      />
    </FormSection>
  );
};

export const medicalDetailsInitialValues: MedicalDetailsFields = {
  certificateExpiration: "",
};

export const medicalDetailsValidations: ObjectShape = {
  certificateExpiration: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
};

export default SectionMedicalDetails;
