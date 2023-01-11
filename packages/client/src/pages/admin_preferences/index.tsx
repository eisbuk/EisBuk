import React, { useState } from "react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";
import { DateTime } from "luxon";

import { defaultEmailTemplates, OrganizationData } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  ValidationMessage,
  useTranslation,
} from "@eisbuk/translations";
import { Layout, Button, ButtonColor, ButtonSize, TabItem } from "@eisbuk/ui";
import { Cog, Mail } from "@eisbuk/svg";

import AdminsField from "./AdminsField";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import { updateOrganization } from "@/store/actions/organizationOperations";
import { getOrganizationSettings } from "@/store/selectors/app";
import { getLocalAuth } from "@/store/selectors/auth";
import { getCustomersByBirthday } from "@/store/selectors/customers";

import { isEmpty } from "@/utils/helpers";

import { adminLinks } from "@/data/navigation";

import EmailTemplateSettings from "./views/EmailTemplateSettings";
import GeneralSettings from "./views/GeneralSettings";

// #region validations
const OrganizationValidation = Yup.object().shape({
  smsFrom: Yup.string()
    .matches(/^[a-z0-9]+$/, i18n.t(ValidationMessage.InvalidSmsFrom))
    .max(11, i18n.t(ValidationMessage.InvalidSmsFromLength)),
  displayName: Yup.string().required(),
});
// #endregion validations

const OrganizationSettings: React.FC = () => {
  enum Views {
    EmailTemplates = "EmailTemplatesSection",
    GeneralSettings = "GeneralSettings",
  }

  // Get appropriate view to render
  const viewsLookup = {
    [Views.EmailTemplates]: EmailTemplateSettings,
    [Views.GeneralSettings]: GeneralSettings,
  };
  const [view, setView] = useState<keyof typeof viewsLookup>(
    Views.GeneralSettings
  );

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
    Object.keys(orgData).forEach((item) => {
      if (item.match("preview")) delete orgData[item];
    });
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

  const additionalButtons = (
    <>
      <TabItem
        key="general-settings-view-button"
        Icon={Cog as any}
        label={i18n.t("SettingsNavigationLabel.GeneralSettings")}
        onClick={() => setView(Views.GeneralSettings)}
        active={view === Views.GeneralSettings}
      />
      <TabItem
        key="email-templates-view-button"
        Icon={Mail as any}
        label={i18n.t("SettingsNavigationLabel.EmailTemplates")}
        onClick={() => setView(Views.EmailTemplates)}
        active={view === Views.EmailTemplates}
      />
    </>
  );

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
      additionalButtons={additionalButtons}
    >
      <div className="content-container pt-[44px] px-[71px] pb-8 md:pt-[62px]">
        <Formik
          {...{ initialValues }}
          onSubmit={(values, actions) => handleSubmit(values, actions)}
          validationSchema={OrganizationValidation}
        >
          {({ isSubmitting, isValidating, handleReset }) => (
            <div className="md:px-11">
              {view === Views.GeneralSettings && (
                <AdminsField currentUser={currentUser} />
              )}

              <Form>
                {view === Views.EmailTemplates ? (
                  <EmailTemplateSettings />
                ) : (
                  <GeneralSettings />
                )}

                <div className="py-4 flex justify-end items-center gap-2">
                  <Button
                    onClick={handleReset}
                    disabled={isSubmitting || isValidating}
                    className="!text-cyan-500"
                    size={ButtonSize.MD}
                  >
                    {t(ActionButton.Reset)}
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
  emailTemplates: defaultEmailTemplates,
  existingSecrets: [],
  location: "",
  defaultCountryCode: "",
  smsFrom: "",
  smsTemplate: "",
  emailBcc: "",
};

export default OrganizationSettings;
