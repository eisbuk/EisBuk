import React from "react";
import { Formik, Form, FormikConfig } from "formik";
import * as Yup from "yup";

import { CustomerBase } from "@eisbuk/shared";
import { useTranslation, ActionButton } from "@eisbuk/translations";

import SectionPersonalDetails, {
  PersonalDetailsFields,
  personalDetailsInitialValues,
  personalDetailsValidations,
} from "./SectionPersonalDetails";
import SectionMedicalDetails, {
  MedicalDetailsFields,
  medicalDetailsInitialValues,
  medicalDetailsValidations,
} from "./SectionMedicalDetails";
import SectionRegistrationCode, {
  RegistrationCodeFields,
  registrationCodeInitialValues,
  registrationCodeValidations,
} from "./SectionRegistrationCode";
import FormButton, { FormButtonColor } from "../FormButton";

type FormSelfRegValues = PersonalDetailsFields &
  MedicalDetailsFields &
  RegistrationCodeFields;

export interface FormSelfRegProps {
  customer: Pick<CustomerBase, "email" | "phone">;
  onSave?: FormikConfig<FormSelfRegValues>["onSubmit"];
  onCancel?: () => void;
  defaultDialCode?: string;
}

/**
 * A variant of customer profile form used by new customers to self register.
 */
const FormSelfReg: React.FC<FormSelfRegProps> = ({
  customer = {},
  onCancel = () => {},
  onSave = () => {},
  defaultDialCode,
}): JSX.Element => {
  const { t } = useTranslation();

  const initialValues = {
    ...personalDetailsInitialValues,
    ...medicalDetailsInitialValues,
    ...registrationCodeInitialValues,
    ...customer,
  };

  const disabledFields = [] as Array<"email" | "phone">;
  if (customer.email) disabledFields.push("email");
  if (customer.phone) disabledFields.push("phone");

  return (
    <Formik
      enableReinitialize
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={(values, formikHelpers) => {
        onSave(values, formikHelpers);
        formikHelpers.setSubmitting(false);
      }}
    >
      {({ isSubmitting, resetForm }) => (
        <Form>
          <div className="flex flex-col gap-y-10 justify-between">
            <SectionPersonalDetails
              defaultDialCode={defaultDialCode}
              disabledFields={disabledFields}
            />
            <SectionMedicalDetails />
            <SectionRegistrationCode />

            <div className="flex justify-self-end gap-x-2 mt-5">
              <FormButton
                type="reset"
                onClick={() => {
                  resetForm();
                  onCancel();
                }}
                color={FormButtonColor.Gray}
                disabled={isSubmitting}
              >
                {t(ActionButton.Cancel)}
              </FormButton>
              <FormButton
                type="submit"
                color={FormButtonColor.Green}
                disabled={isSubmitting}
              >
                {t(ActionButton.Save)}
              </FormButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

const validationSchema = Yup.object().shape({
  ...personalDetailsValidations,
  ...medicalDetailsValidations,
  ...registrationCodeValidations,
});

export default FormSelfReg;
