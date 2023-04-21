import React, { useState, useEffect } from "react";
import { Formik, Form, FormikConfig } from "formik";
import * as Yup from "yup";

import {
  useTranslation,
  ActionButton,
  CustomerFormTitle,
  CustomerLabel,
} from "@eisbuk/translations";
import { ChevronLeft, Calendar } from "@eisbuk/svg";
import { CustomerFull } from "@eisbuk/shared";

import FormButton, { FormButtonColor } from "../FormButton";
import FormField, { FormFieldVariant } from "../FormField";
import FormSection from "../FormSection";

import SectionPersonalDetails, {
  personalDetailsInitialValues,
  personalDetailsValidations,
} from "./SectionPersonalDetails";
import SectionMedicalDetails, {
  medicalDetailsInitialValues,
  medicalDetailsValidations,
} from "./SectionMedicalDetails";
import SectionAdminOnly, {
  adminOnlyInitialValues,
  AdminOnlyValidations,
} from "./SectionAdminOnly";

type FormAdminValues = Omit<CustomerFull, "id" | "secretKey">;

export interface FormAdminProps {
  customer?: FormAdminValues;
  onSave?: FormikConfig<FormAdminValues>["onSubmit"];
  onDelete?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  onBookingDateExtended?: (newDate: string) => void;
  additionalActions?: React.ReactNode;
  defaultDialCode?: string;
  subscriptionNumber?: string;
}

const CustomerCard: React.FC<FormAdminProps> = ({
  customer,
  onSave = () => {},
  onDelete = () => {},
  onCancel = () => {},
  onClose = () => {},
  onBookingDateExtended = () => {},
  additionalActions,
  defaultDialCode,
  subscriptionNumber,
}) => {
  const { t } = useTranslation();

  // If customer is not provided, we're in (customer) create mode
  const isCreate = !customer;

  // We sometimes want to redirect when form is submitted, but want to avoid
  // the memory-leak warning: updating state on unmounted component
  const isUnmounted = React.useRef(false);
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
    };
  }, []);

  // If in create mode, we're always in edit mode
  const [isEditing, setIsEditing] = useState(isCreate);

  const toggleEdit = () => {
    // No-op if the component is unmounted or in create mode
    if (isUnmounted.current || isCreate) return;
    setIsEditing((isEditing) => !isEditing);
  };

  const initialValues: FormAdminValues = {
    ...personalDetailsInitialValues,
    ...medicalDetailsInitialValues,
    ...adminOnlyInitialValues,
    // We're adding a subscription number for create mode (should be passed as default)
    // however, if in edit customer mode, the subscription number is already in the customer object (and will overwrite the undefined value)
    subscriptionNumber: subscriptionNumber || "",
    ...(customer ? customer : {}),
  };

  const title = customer
    ? t(CustomerFormTitle.AthleteProfile, {
        name: customer.name,
        surname: customer.surname,
      })
    : t(CustomerFormTitle.NewCustomer);

  const handleCancel = (resetForm: () => void) => () => {
    // If in create mode, view mode is not available, so we're closing the form
    // on "cancel" button click
    if (isCreate) {
      onClose();
    } else {
      // If switching edit mode (we're updating an existing customer) cancelling the form stays on
      // the same view, only resets (and disables) the form.
      resetForm();
      toggleEdit();
      onCancel();
    }
  };

  return (
    <div className="pb-8">
      <div className="pt-3 pb-8">
        <button
          onClick={onClose}
          className="inline-block py-2 pr-3 -translate-x-2 mb-6"
        >
          <span className="inline-block h-6 w-6 align-middle mr-1.5">
            <ChevronLeft />
          </span>
          <span className="align-middle">{t(ActionButton.Back)}</span>
        </button>
      </div>

      <div className="flex flex-col gap-y-10 justify-between md:px-11">
        <Formik
          enableReinitialize
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={async (values, formikHelpers) => {
            const res = onSave(values, formikHelpers);
            if (res instanceof Promise) {
              await res;
            }
            formikHelpers.setSubmitting(false);

            if (isCreate) {
              // If in create mode, we wish to close the form on successful submission
              onClose();
            } else {
              // If in edit mode, we're merely switching to view mode
              toggleEdit();
            }
          }}
        >
          {({ isSubmitting, resetForm }) => (
            <Form>
              <div className="flex flex-wrap justify-left gap-x-10 mb-5 items-center">
                <h1 className="relative inline-block mb-5 text-2xl font-normal leading-none text-gray-700 cursor-normal select-none">
                  {title}
                </h1>

                {!isCreate && (
                  <FormActionButtons
                    className="mb-5"
                    isSubmitting={isSubmitting}
                    isEditing={isEditing}
                    onCancel={handleCancel(resetForm)}
                    onEdit={toggleEdit}
                  />
                )}
              </div>

              <SectionPersonalDetails
                defaultDialCode={defaultDialCode}
                disabled={!isEditing}
              />
              <SectionMedicalDetails disabled={!isEditing} />
              <SectionAdminOnly disabled={!isEditing} />

              <FormActionButtons
                className="mt-5"
                isSubmitting={isSubmitting}
                isEditing={isEditing}
                onCancel={handleCancel(resetForm)}
                onEdit={toggleEdit}
              />
            </Form>
          )}
        </Formik>

        <div className="w-full h-0.5 bg-gray-100 my-3" />

        {!isCreate && ( // Additional actions are only available if the customer exists (a customer card variant)
          <FormSection title="Additional actions">
            <ExtendBookingDateField
              onBookingDateExtended={onBookingDateExtended}
              formDisabled={!isEditing}
              extendedDate={customer?.extendedDate || undefined}
            />

            {additionalActions && (
              <div className="col-span-6">{additionalActions}</div>
            )}

            <div className="col-span-6">
              <FormButton
                type="button"
                onClick={() => {
                  onDelete();
                }}
                color={FormButtonColor.Red}
              >
                {t(ActionButton.DeleteCustomer)}
              </FormButton>
            </div>
          </FormSection>
        )}
      </div>
    </div>
  );
};

interface FormActionButtonProps {
  className?: string;
  onEdit: () => void;
  onCancel: () => void;
  isEditing: boolean;
  isSubmitting: boolean;
}

const FormActionButtons: React.FC<FormActionButtonProps> = ({
  className = "",
  onEdit,
  onCancel,
  isEditing,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex justify-self-end gap-x-2 ${className}`}>
      {isEditing ? (
        <>
          <FormButton
            type="reset"
            onClick={onCancel}
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
        </>
      ) : (
        <>
          <FormButton
            type="button"
            onClick={onEdit}
            color={FormButtonColor.Cyan}
          >
            {t(ActionButton.Edit)}
          </FormButton>
        </>
      )}
    </div>
  );
};

interface ExtendBookingDateFieldProps {
  onBookingDateExtended: (date: string) => void;
  formDisabled?: boolean;
  extendedDate?: string;
}
/**
 * Additional field for extending the booking date. Extending of the booking date is
 * detached from the rest of the form, so we're using a separate formik component
 */
const ExtendBookingDateField: React.FC<ExtendBookingDateFieldProps> = ({
  formDisabled,
  onBookingDateExtended = () => {},
  extendedDate = "",
}) => {
  const { t } = useTranslation();

  // This state lets us enable editing (and submission of the extended date field)
  // on 'extend booking date' button click, provided the form is not disabled
  const [enableExtendDate, setEnableExtendDate] = React.useState(false);

  useEffect(() => {
    // If the form is enabled, we disable the 'extendedDate' field
    if (!formDisabled) {
      setEnableExtendDate(false);
    }
  }, [formDisabled]);

  return (
    <Formik
      // We're changing the key each time the other form is enabled/disabled
      // to reset the value of non-submitted field
      key={String(enableExtendDate)}
      enableReinitialize
      onSubmit={async ({ extendedDate }) => {
        onBookingDateExtended(extendedDate);
        // We're disabling (and in effect reseting the field after submission)
        // this is ok as the field (if updated) should make a round trip and get updated
        // back from the source. (If rejected, it's a no-op)
        setEnableExtendDate(false);
      }}
      initialValues={{ extendedDate }}
    >
      <Form className="col-span-6 lg:col-span-5 xl:col-span-4 flex justify-between items-center">
        <FormField
          name="extendedDate"
          variant={FormFieldVariant.Date}
          label={t(CustomerLabel.ExtendedBookingDate)}
          Icon={Calendar}
          disabled={!enableExtendDate}
        />

        {enableExtendDate ? (
          <div className="flex gap-3">
            <FormButton
              color={FormButtonColor.Gray}
              onClick={() => setEnableExtendDate(false)}
            >
              {t(ActionButton.Cancel)}
            </FormButton>
            <FormButton color={FormButtonColor.Green} type="submit">
              {t(ActionButton.Save)}
            </FormButton>
          </div>
        ) : (
          <FormButton
            type="button"
            color={FormButtonColor.Cyan}
            onClick={(e) => {
              e.preventDefault();
              setEnableExtendDate(true);
            }}
            // We don't allow for extending booking date
            // while the form is endabled (to prevent clashes)
            disabled={!formDisabled}
          >
            {t(ActionButton.ExtendBookingDate)}
          </FormButton>
        )}
      </Form>
    </Formik>
  );
};

const validationSchema = Yup.object({
  ...personalDetailsValidations,
  ...medicalDetailsValidations,
  ...AdminOnlyValidations,
});

export default CustomerCard;
