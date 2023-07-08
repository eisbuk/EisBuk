import React from "react";
import { Field, useFormikContext } from "formik";
import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";

import i18n, {
  useTranslation,
  CustomerLabel,
  ValidationMessage,
  CategoryLabel,
} from "@eisbuk/translations";
import { Identification } from "@eisbuk/svg";
import { Category } from "@eisbuk/shared";

import FormSection from "../FormSection";
import FormField, { FormFieldVariant, FormFieldWitdh } from "../FormField";
import Checkbox from "../../Checkbox";

export interface AdminOnlyFields {
  categories: Category[];
  subscriptionNumber: string;
}

interface SectionProps {
  disabled?: boolean;
  disabledFields?: Array<keyof AdminOnlyFields>;
  additionalContent?: React.ReactNode;
}

const SectionAdminOnly: React.FC<SectionProps> = ({
  additionalContent,
  ...contextProps
}) => {
  const { t } = useTranslation();

  const { errors } = useFormikContext<AdminOnlyFields>();

  const availableCategories = Object.values(Category);

  const categoryOptions = availableCategories.map((category) => ({
    value: category,
    label: t(CategoryLabel[category]),
  }));

  return (
    <FormSection
      title={t(CustomerLabel.AdminValues)}
      subtitle={t(CustomerLabel.AdminValuesDescription)}
      {...contextProps}
    >
      <label
        htmlFor="categories"
        className={`${FormFieldWitdh.Full} block text-sm font-medium text-gray-700`}
      >
        {t(CustomerLabel.Categories)}
      </label>

      <fieldset className="col-span-4 grid grid-cols-4 gap-2">
        {categoryOptions.map((category) => (
          <Field
            {...category}
            name="categories"
            type="checkbox"
            className="col-span-2"
            key={category.label}
            component={Checkbox}
            disabled={contextProps.disabled}
          />
        ))}
      </fieldset>
      <p
        className={`${FormFieldWitdh.Full} mt-2 text-sm min-h-[20px] text-red-600`}
      >
        {errors.categories && errors.categories}
      </p>

      <FormField
        name="subscriptionNumber"
        variant={FormFieldVariant.Text}
        width={FormFieldWitdh.MD}
        label={t(CustomerLabel.CardNumber)}
        Icon={Identification}
      />

      {additionalContent}
    </FormSection>
  );
};

export const adminOnlyInitialValues: AdminOnlyFields = {
  categories: [],
  subscriptionNumber: "",
};

export const AdminOnlyValidations: ObjectShape = {
  subscriptionNumber: Yup.number(),
  categories: Yup.array()
    .required(i18n.t(ValidationMessage.RequiredField))
    .min(1, i18n.t(ValidationMessage.RequiredEntry))
    .of(Yup.string()),
};

export default SectionAdminOnly;
