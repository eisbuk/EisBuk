import React, { useState } from "react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";

import {
  defaultEmailTemplates as emailTemplates,
  defaultSMSTemplates as smsTemplates,
  OrganizationData,
} from "@eisbuk/shared";
import i18n, {
  ActionButton,
  ValidationMessage,
  useTranslation,
  SettingsNavigationLabel,
} from "@eisbuk/translations";
import {
  Button,
  ButtonColor,
  ButtonSize,
  TabItem,
  LayoutContent,
} from "@eisbuk/ui";
import { Cog, Mail } from "@eisbuk/svg";

import Layout from "@/controllers/Layout";
import AdminsField from "./AdminsField";

import { updateOrganization } from "@/store/actions/organizationOperations";
import { getOrganizationSettings } from "@/store/selectors/app";
import { getLocalAuth } from "@/store/selectors/auth";

import { isEmpty } from "@/utils/helpers";

import EmailTemplateSettings from "./views/EmailTemplateSettings";
import GeneralSettings from "./views/GeneralSettings";
import SMSTemplateSettings from "./views/SMSTemplateSettings";

// #region validations
const OrganizationValidation = Yup.object().shape({
  smsFrom: Yup.string()
    .matches(/^[a-z0-9]+$/, i18n.t(ValidationMessage.InvalidSmsFrom))
    .max(11, i18n.t(ValidationMessage.InvalidSmsFromLength)),
  displayName: Yup.string().required(),
});
// #endregion validations

const OrganizationSettings: React.FC = () => {
  enum View {
    GeneralSettings = "GeneralSettings",
    EmailTemplates = "EmailTemplates",
    SMSTemplates = "SMSTemplates",
  }

  // Get appropriate view to render
  const viewsLookup = {
    [View.GeneralSettings]: GeneralSettings,
    [View.EmailTemplates]: EmailTemplateSettings,
    [View.SMSTemplates]: SMSTemplateSettings,
  };
  const [view, setView] = useState<keyof typeof viewsLookup>(
    View.GeneralSettings
  );

  const dispatch = useDispatch();

  const organization = useSelector(getOrganizationSettings);
  const userAuthInfo = useSelector(getLocalAuth);
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
        label={i18n.t(SettingsNavigationLabel.GeneralSettings)}
        onClick={() => setView(View.GeneralSettings)}
        active={view === View.GeneralSettings}
      />
      <TabItem
        key="email-templates-view-button"
        Icon={Mail as any}
        label={i18n.t(SettingsNavigationLabel.EmailTemplates)}
        onClick={() => setView(View.EmailTemplates)}
        active={view === View.EmailTemplates}
      />
      <TabItem
        key="sms-templates-view-button"
        Icon={Mail as any}
        label={i18n.t(SettingsNavigationLabel.SMSTemplates)}
        onClick={() => setView(View.SMSTemplates)}
        active={view === View.SMSTemplates}
      />
    </>
  );

  return (
    <Layout additionalButtons={additionalButtons}>
      <Formik
        {...{ initialValues }}
        onSubmit={(values, actions) => handleSubmit(values, actions)}
        validationSchema={OrganizationValidation}
      >
        {({ isSubmitting, isValidating, handleReset }) => (
          <Form className="flex flex-col overflow-hidden">
            <LayoutContent
              actionButtons={
                <div className="py-2 flex justify-end items-center gap-2">
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
              }
            >
              {view === View.GeneralSettings ? (
                <div className="pt-[44px] px-[71px] pb-8 md:pt-[62px]">
                  <div className="md:px-11">
                    <AdminsField currentUser={currentUser} />
                    <GeneralSettings />
                  </div>
                </div>
              ) : view === View.EmailTemplates ? (
                <EmailTemplateSettings />
              ) : (
                <div>
                  <SMSTemplateSettings />
                </div>
              )}
            </LayoutContent>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

const emptyValues = {
  admins: [],
  displayName: "",
  emailFrom: "",
  emailNameFrom: "",
  emailTemplates,
  existingSecrets: [],
  location: "",
  defaultCountryCode: "",
  smsFrom: "",
  smsTemplates,
  emailBcc: "",
};

export default OrganizationSettings;
