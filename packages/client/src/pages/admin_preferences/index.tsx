import React from "react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";
import { DateTime } from "luxon";

import { defaultEmailTemplates, OrganizationData } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  ValidationMessage,
  useTranslation,
  OrganizationLabel,
} from "@eisbuk/translations";
import {
  Layout,
  CountryCodesDropdownFormik,
  Button,
  ButtonColor,
  ButtonSize,
} from "@eisbuk/ui";

import AdminsField from "./AdminsField";
import FormSection, {
  FormSectionFieldProps,
} from "@/components/atoms/FormSection";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import { updateOrganization } from "@/store/actions/organizationOperations";
import { getOrganizationSettings } from "@/store/selectors/app";
import { getLocalAuth } from "@/store/selectors/auth";
import { getCustomersByBirthday } from "@/store/selectors/customers";

import { isEmpty } from "@/utils/helpers";

import { adminLinks } from "@/data/navigation";

// #region validations
const OrganizationValidation = Yup.object().shape({
  smsFrom: Yup.string()
    .matches(/^[a-z0-9]+$/, i18n.t(ValidationMessage.InvalidSmsFrom))
    .max(11, i18n.t(ValidationMessage.InvalidSmsFromLength)),
  displayName: Yup.string().required(),
});
// #endregion validations

const OrganizationSettings: React.FC = () => {
  const dispatch = useDispatch();

  const organization = useSelector(getOrganizationSettings);
  const userAuthInfo = useSelector(getLocalAuth);
  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  const { t } = useTranslation();

  const handleSubmit = (
    orgData: OrganizationData,
    actions: FormikHelpers<OrganizationData>
  ) => {
    dispatch(updateOrganization(orgData, actions.setSubmitting));
  };

  const currentUser = userAuthInfo?.email || "";
  if (isEmpty(organization)) {
    return null;
  }

  const initialValues: OrganizationData = {
    ...emptyValues,
    ...(organization as OrganizationData),
  };

  const title = `${organization?.displayName || "Organization"}  Settings`;

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <div className="content-container pt-[44px] px-[71px] pb-8 md:pt-[62px]">
        <div className="pt-6 pb-8">
          <h1 className="text-2xl font-normal leading-none text-gray-700 cursor-normal select-none">
            {title}
          </h1>
        </div>
        <Formik
          {...{ initialValues }}
          onSubmit={(values, actions) => handleSubmit(values, actions)}
          validationSchema={OrganizationValidation}
        >
          {({ isSubmitting, isValidating, handleReset }) => (
            <div className="md:px-11">
              <AdminsField currentUser={currentUser} />

              <Form>
                <FormSection content={generalFields} title="General" />
                <FormSection content={emailFields} title="Email" />
                <FormSection content={smsFields} title="SMS" />

                <div className="py-4 flex justify-end items-center gap-2">
                  <Button
                    onClick={handleReset}
                    disabled={isSubmitting || isValidating}
                    className="!text-cyan-500"
                    size={ButtonSize.MD}
                  >
                    {t(ActionButton.Cancel)}
                  </Button>
                  <Button
                    disabled={isSubmitting || isValidating}
                    color={ButtonColor.Primary}
                    size={ButtonSize.MD}
                    aria-label={"save"}
                    type="submit"
                  >
                    {t(ActionButton.Save)}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Formik>
      </div>
    </Layout>
  );
};

const emptyValues = {
  admins: [],
  displayName: "",
  emailFrom: "",
  emailNameFrom: "",
  emailTemplate: defaultEmailTemplates,
  existingSecrets: [],
  location: "",
  defaultCountryCode: "",
  smsFrom: "",
  smsTemplate: "",
  emailBcc: "",
};

// #region fieldSetup
const generalFields: FormSectionFieldProps[] = [
  {
    name: "displayName",
    label: i18n.t(OrganizationLabel.DisplayName),
  },
  {
    name: "location",
    label: i18n.t(OrganizationLabel.Location),
  },
  {
    name: "registrationCode",
    label: i18n.t(OrganizationLabel.RegistrationCode),
  },
  {
    name: "defaultCountryCode",
    label: i18n.t(OrganizationLabel.CountryCode),
    component: CountryCodesDropdownFormik,
  },
];
const emailFields: FormSectionFieldProps[] = [
  {
    name: "emailNameFrom",
    label: i18n.t(OrganizationLabel.EmailNameFrom),
  },
  {
    name: "emailFrom",
    label: i18n.t(OrganizationLabel.EmailFrom),
  },
  {
    name: "bcc",
    label: i18n.t(OrganizationLabel.BCC),
  },
  {
    name: "emailTemplate",
    label: i18n.t(OrganizationLabel.EmailTemplate),
    multiline: true,
    rows: 6,
  },
];
const smsFields: FormSectionFieldProps[] = [
  {
    name: "smsFrom",
    label: i18n.t(OrganizationLabel.SmsFrom),
  },
  {
    name: "smsTemplate",
    label: i18n.t(OrganizationLabel.SmsTemplate),
    multiline: true,
    rows: 6,
  },
];
// #endregion fieldSetup

export default OrganizationSettings;
