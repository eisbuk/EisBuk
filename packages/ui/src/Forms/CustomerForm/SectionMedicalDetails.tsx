import React from "react";
import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";
import { useField } from "formik";
import { DateTime } from "luxon";

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
  /**
   * The certificate expiration date is managed by club admins only (#955):
   * athletes see it (with a warning if missing or expired), but can't edit it.
   */
  readOnly?: boolean;
}

const SectionMedicalDetails: React.FC<SectionProps> = ({
  readOnly = false,
  ...contextProps
}) => {
  const { t } = useTranslation();
  const [{ value: certificateExpiration }] = useField<string>(
    "certificateExpiration",
  );

  // The certificate is valid through its expiration day. Only a real
  // "yyyy-mm-dd" date can be compared with today as a string (`isISODay`
  // alone accepts other ISO forms, e.g. week dates like "2026-W01-1")
  const status = !certificateExpiration
    ? t(CustomerLabel.CertificateMissing)
    : !/^\d{4}-\d{2}-\d{2}$/.test(certificateExpiration) ||
        !isISODay(certificateExpiration)
      ? t(CustomerLabel.CertificateInvalid)
      : certificateExpiration < DateTime.now().toISODate()
        ? t(CustomerLabel.CertificateExpired)
        : null;

  return (
    <FormSection
      title={t(CustomerLabel.MedicalDetails)}
      subtitle={
        readOnly
          ? t(CustomerLabel.CertificateManagedByAdmins)
          : t(CustomerLabel.ManageMedicalDetails)
      }
      {...contextProps}
    >
      <FormField
        name="certificateExpiration"
        variant={FormFieldVariant.Date}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.CertificateExpiration)}
        Icon={ClipboardList}
        disabled={readOnly}
        EndAdornment={
          readOnly && status ? (
            <span className="whitespace-nowrap rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {status}
            </span>
          ) : null
        }
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
