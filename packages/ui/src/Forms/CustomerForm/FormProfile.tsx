import React, { useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import * as Yup from "yup";

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
import FormButton, { FormButtonColor } from "../FormButton";

type FormProfileValues = PersonalDetailsFields & MedicalDetailsFields;

export interface FormProfile {
  customer: Partial<FormProfileValues>;
  onSave?: FormikConfig<FormProfileValues>["onSubmit"];
  onCancel?: () => void;
  defaultDialCode?: string;
}

/**
 * A variant of customer profile form used by customers to edit their own profile (in customer area).
 */
const FormProfile: React.FC<FormProfile> = ({
  customer = {},
  onCancel = () => {},
  onSave = () => {},
  defaultDialCode,
}): JSX.Element => {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((isEditing) => !isEditing);
  };

  const initialValues = {
    ...personalDetailsInitialValues,
    ...medicalDetailsInitialValues,
    ...customer,
  };

  return (
    <Formik
      enableReinitialize
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={(values, formikHelpers) => {
        onSave(values, formikHelpers);
        formikHelpers.setSubmitting(false);
        toggleEdit();
      }}
    >
      {({ resetForm, isSubmitting }) => (
        <Form>
          <div className="flex flex-col gap-y-10 justify-between">
            <SectionPersonalDetails
              defaultDialCode={defaultDialCode}
              disabled={!isEditing}
            />
            <SectionMedicalDetails disabled={!isEditing} />

            <div className="flex justify-self-end gap-x-2 mt-5">
              {isEditing ? (
                <>
                  <FormButton
                    type="reset"
                    onClick={() => {
                      resetForm();
                      onCancel();
                      toggleEdit();
                    }}
                    color={FormButtonColor.Gray}
                    disabled={isSubmitting}
                  >
                    {t(ActionButton.Cancel)}
                  </FormButton>
                  <FormButton
                    color={FormButtonColor.Green}
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {t(ActionButton.Save)}
                  </FormButton>
                </>
              ) : (
                <FormButton
                  type="button"
                  onClick={toggleEdit}
                  color={FormButtonColor.Cyan}
                >
                  {t(ActionButton.Edit)}
                </FormButton>
              )}
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
});

export default FormProfile;
