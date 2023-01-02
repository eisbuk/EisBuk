import React from "react";
import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";

import i18n, {
  useTranslation,
  CustomerLabel,
  ValidationMessage,
} from "@eisbuk/translations";
import { ShieldCheck, ClipboardList } from "@eisbuk/svg";

import FormSection from "../FormSection";
import FormField, { FormFieldVariant, FormFieldWitdh } from "../FormField";

import { isISODay } from "../../utils/date";

export interface MedicalDetailsFields {
  certificateExpiration: string;
  covidCertificateReleaseDate: string;
  covidCertificateSuspended: boolean;
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

      <FormField
        name="covidCertificateReleaseDate"
        variant={FormFieldVariant.Date}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.CovidCertificateReleaseDate)}
        Icon={ShieldCheck}
      />

      <FormField
        name="covidCertificateSuspended"
        variant={FormFieldVariant.Checkbox}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.CovidCertificateSuspended)}
        helpText="Check this box if your COVID certificate is more than 9 months old"
      />
    </FormSection>
  );
};

export const medicalDetailsInitialValues: MedicalDetailsFields = {
  certificateExpiration: "",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: false,
};

export const medicalDetailsValidations: ObjectShape = {
  certificateExpiration: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  covidCertificateReleaseDate: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  covidCertificateSuspended: Yup.boolean(),
};

export default SectionMedicalDetails;
