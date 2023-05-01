import React from "react";
import { useSelector } from "react-redux";

import { useTranslation, EmailTemplateLabel } from "@eisbuk/translations";
import { FormSection } from "@eisbuk/ui";
import { EmailTypeButtons, EmailType } from "@eisbuk/shared";

import { getOrganizationSettings } from "@/store/selectors/app";

import EmailTemplate from "../EmailTemplate";
import PreviewField from "../PreviewField";
import Buttons from "../Buttons";

const EmailTemplateSettings: React.FC = () => {
  // Keep a ref of the input element
  const input = React.useRef<HTMLInputElement | null>(null);

  const organization = useSelector(getOrganizationSettings);

  const { t } = useTranslation();

  const buttons: EmailTypeButtons = {
    [EmailType.SendBookingsLink]: {
      bookingsLink: "bookingsLink",
      name: "name",
      surname: "surname",
    },
    [EmailType.SendCalendarFile]: {
      name: "name",
      surname: "surname",
      calendarFile: "calendarFile",
    },
    [EmailType.SendExtendedBookingsDate]: {
      bookingsMonth: "bookingsMonth",
      extendedBookingsDate: "extendedBookingsDate",
      name: "name",
      surname: "surname",
    },
  };
  return (
    <div>
      {organization.emailTemplates &&
        Object.entries(organization.emailTemplates).map(([name, temp]) => {
          return (
            <FormSection key={name} title={t(EmailTemplateLabel[name])}>
              <div className="flex-row">
                <Buttons
                  buttons={buttons}
                  emailType={name as EmailType}
                  input={input}
                />

                <EmailTemplate input={input} label={name} />
                <PreviewField name={name} template={temp} />
              </div>
            </FormSection>
          );
        })}
    </div>
  );
};

export default EmailTemplateSettings;
