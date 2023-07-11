import React from "react";
import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";

import i18n, {
  useTranslation,
  CustomerLabel,
  ValidationMessage,
} from "@eisbuk/translations";
import { User, Cake, Mail, Phone } from "@eisbuk/svg";
import { isValidPhoneNumber } from "@eisbuk/shared";

import { testId } from "@eisbuk/testing/testIds";

import FormSection from "../FormSection";
import FormField, { FormFieldVariant, FormFieldWitdh } from "../FormField";

import { isISODay } from "../../utils/date";

export interface PersonalDetailsFields {
  name: string;
  surname: string;
  birthday: string;
  email: string;
  phone: string;
}

interface SectionProps {
  disabled?: boolean;
  disabledFields?: Array<keyof PersonalDetailsFields>;
  defaultDialCode?: string;
}

const SectionPersonalDetails: React.FC<SectionProps> = ({
  defaultDialCode,
  ...contextProps
}) => {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t(CustomerLabel.PersonalDetails)}
      subtitle={t(CustomerLabel.ManagePersonalDetails)}
      {...contextProps}
    >
      <FormField
        name="name"
        variant={FormFieldVariant.Text}
        label={t(CustomerLabel.Name)}
        Icon={User}
      />

      <FormField
        name="surname"
        variant={FormFieldVariant.Text}
        label={t(CustomerLabel.Surname)}
        Icon={User}
      />

      <FormField
        name="birthday"
        variant={FormFieldVariant.Date}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.Birthday)}
        data-testid={testId("birthday-input")}
        Icon={Cake}
      />

      <FormField
        name="email"
        variant={FormFieldVariant.Text}
        label={t(CustomerLabel.Email)}
        Icon={Mail}
      />

      <FormField
        name="phone"
        variant={FormFieldVariant.Phone}
        label={t(CustomerLabel.Phone)}
        Icon={Phone}
        defaultDialCode={defaultDialCode}
      />
    </FormSection>
  );
};

export const personalDetailsInitialValues: PersonalDetailsFields = {
  name: "",
  surname: "",
  birthday: "",
  email: "",
  phone: "",
};

export const personalDetailsValidations: ObjectShape = {
  name: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  surname: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  email: Yup.string().email(i18n.t(ValidationMessage.Email)),
  phone: Yup.string().test({
    test: (input) => !input || isValidPhoneNumber(input),
    message: i18n.t(ValidationMessage.InvalidPhone),
  }),
  birthday: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
};

export default SectionPersonalDetails;
