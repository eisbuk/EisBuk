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
import {
  defaultPrivacyPolicyParams,
  defaultPrivacyPolicy,
} from "@eisbuk/shared/ui";
import { Cog, Mail } from "@eisbuk/svg";

import AdminBar from "@/controllers/AdminBar";
import { NotificationsContainer } from "@/features/notifications/components";
import AdminsField from "./AdminsField";

import { updateOrganization } from "@/store/actions/organizationOperations";
import { getOrganizationSettings } from "@/store/selectors/app";
import { getLocalAuth } from "@/store/selectors/auth";

import { isEmpty } from "@/utils/helpers";

import EmailTemplateSettings from "./views/EmailTemplateSettings";
import GeneralSettings from "./views/GeneralSettings";
import SMSTemplateSettings from "./views/SMSTemplateSettings";
import PrivacyPolicy from "./views/PrivacyPolicy";

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
    PrivacyPolicy = "PrivacyPolicy",
  }

  // Get appropriate view to render
  const viewsLookup = {
    [View.GeneralSettings]: GeneralSettings,
    [View.EmailTemplates]: EmailTemplateSettings,
    [View.SMSTemplates]: SMSTemplateSettings,
    [View.PrivacyPolicy]: PrivacyPolicy,
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
      <TabItem
        key="privacy-policy-view-button"
        Icon={Mail as any}
        label="Privacy policy"
        onClick={() => setView(View.PrivacyPolicy)}
        active={view === View.PrivacyPolicy}
      />
    </>
  );

  const additionalButtonsSM = (
    <>
      <button
        key="general-settings-view-button"
        onClick={() => setView(View.GeneralSettings)}
        className={`rounded px-2 py-0.5 border overflow-hidden ${
          view === View.GeneralSettings
            ? "bg-cyan-700 text-white border-cyan-700"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        {i18n.t(SettingsNavigationLabel.GeneralSettings)}
      </button>
      <button
        key="email-templates-view-button"
        onClick={() => setView(View.EmailTemplates)}
        className={`rounded px-2 py-0.5 border overflow-hidden ${
          view === View.EmailTemplates
            ? "bg-cyan-700 text-white border-cyan-700"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        {i18n.t(SettingsNavigationLabel.EmailTemplates)}
      </button>
      <button
        key="sms-templates-view-button"
        onClick={() => setView(View.SMSTemplates)}
        className={`rounded px-2 py-0.5 border overflow-hidden ${
          view === View.SMSTemplates
            ? "bg-cyan-700 text-white border-cyan-700"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        {i18n.t(SettingsNavigationLabel.SMSTemplates)}
      </button>
      <button
        key="privacy-policy-view-button"
        onClick={() => setView(View.PrivacyPolicy)}
        className={`rounded px-2 py-0.5 border overflow-hidden ${
          view === View.PrivacyPolicy
            ? "bg-cyan-700 text-white border-cyan-700"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        Privacy policy
      </button>
    </>
  );

  return (
    <div className="absolute top-0 right-0 left-0 flex flex-col pt-[168px] md:pt-[212px] overflow-hidden">
      <header className="fixed left-0 top-0 right-0 bg-gray-800 z-50">
        <div className="content-container">
          <AdminBar className="flex w-full h-[70px] py-[15px] justify-between items-center print:hidden" />

          <div className="hidden w-full h-[70px] py-[15px] justify-between items-center md:flex print:hidden">
            <div>{null}</div>
            {null}
          </div>

          <div className="w-full h-[2px] bg-gray-700" />

          <div className="flex w-full h-[96px] py-[15px] justify-between items-center md:h-[70px] print:hidden">
            <div className="hidden w-full max-w-1/2 justify-start items-center gap-3 whitespace-nowrap md:flex">
              {additionalButtons}
            </div>

            <div className="grid grid-cols-2 grid-rows-2 w-full justify-center items-center gap-x-4 gap-y-2 whitespace-nowrap md:hidden">
              {additionalButtonsSM}
            </div>

            <div className="hidden md:block md:w-full">
              <NotificationsContainer className="w-full md:w-auto" />
            </div>
          </div>
        </div>
      </header>

      <Formik
        {...{ initialValues }}
        onSubmit={(values, actions) => handleSubmit(values, actions)}
        validationSchema={OrganizationValidation}
      >
        {({ isSubmitting, isValidating, handleReset }) => (
          <LayoutContent
            Component={Form as any}
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
            ) : view === View.SMSTemplates ? (
              <div>
                <SMSTemplateSettings />
              </div>
            ) : (
              <div>
                <PrivacyPolicy />
              </div>
            )}

            <div className="fixed px-4 bottom-4 right-0 z-40 md:hidden">
              <NotificationsContainer />
            </div>
          </LayoutContent>
        )}
      </Formik>
    </div>
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
  privacyPolicy: {
    ...defaultPrivacyPolicyParams,
    policy: defaultPrivacyPolicy,
  },
};

export default OrganizationSettings;
