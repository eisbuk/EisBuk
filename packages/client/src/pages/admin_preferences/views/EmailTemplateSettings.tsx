import React from "react";
import { useSelector } from "react-redux";

import { ClientMessageType } from "@eisbuk/shared";

import { getOrganizationSettings } from "@/store/selectors/app";

import TemplateBlock from "../TemplateBlock";
import { EmailTemplateLabel } from "@eisbuk/translations";

const EmailTemplateSettings: React.FC = () => {
  const organization = useSelector(getOrganizationSettings);

  const buttons = {
    [ClientMessageType.SendBookingsLink]: [
      { label: EmailTemplateLabel.BookingsLink, value: "bookingsLink" },
      { label: EmailTemplateLabel.Name, value: "name" },
      { label: EmailTemplateLabel.Surname, value: "surname" },
    ],
    [ClientMessageType.SendCalendarFile]: [
      { label: EmailTemplateLabel.Name, value: "name" },
      { label: EmailTemplateLabel.Surname, value: "surname" },
      { label: EmailTemplateLabel.CalendarFile, value: "calendarFile" },
    ],
    [ClientMessageType.SendExtendedBookingsDate]: [
      { label: EmailTemplateLabel.BookingsMonth, value: "bookingsMonth" },
      {
        label: EmailTemplateLabel.ExtendedBookingsDate,
        value: "extendedBookingsDate",
      },
      { label: EmailTemplateLabel.Name, value: "name" },
      { label: EmailTemplateLabel.Surname, value: "surname" },
    ],
  };

  return (
    <div>
      {organization.emailTemplates &&
        Object.keys(organization.emailTemplates).map((name) => (
          <TemplateBlock name={name} buttons={buttons[name]} />
        ))}
    </div>
  );
};

export default EmailTemplateSettings;
