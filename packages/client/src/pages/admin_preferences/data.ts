import { ClientMessageType } from "@eisbuk/shared";
import { MessageTemplateLabel } from "@eisbuk/translations";

export const buttons = {
  [ClientMessageType.SendBookingsLink]: [
    { label: MessageTemplateLabel.Name, value: "name" },
    { label: MessageTemplateLabel.Surname, value: "surname" },
    { label: MessageTemplateLabel.BookingsLink, value: "bookingsLink" },
    { label: MessageTemplateLabel.OrganizationName, value: "organizationName" },
    { label: MessageTemplateLabel.Deadline, value: "deadline" },
  ],
  [ClientMessageType.SendCalendarFile]: [
    { label: MessageTemplateLabel.Name, value: "name" },
    { label: MessageTemplateLabel.Surname, value: "surname" },
    { label: MessageTemplateLabel.CalendarFile, value: "calendarFile" },
    { label: MessageTemplateLabel.OrganizationName, value: "organizationName" },
  ],
  [ClientMessageType.SendExtendedBookingsDate]: [
    { label: MessageTemplateLabel.Name, value: "name" },
    { label: MessageTemplateLabel.Surname, value: "surname" },
    { label: MessageTemplateLabel.BookingsMonth, value: "bookingsMonth" },
    {
      label: MessageTemplateLabel.ExtendedBookingsDate,
      value: "extendedBookingsDate",
    },
    { label: MessageTemplateLabel.OrganizationName, value: "organizationName" },
  ],
};

export const previewValues = {
  organizationName: "Organization Name",
  name: "Saul",
  surname: "Goodman",
  bookingsLink: "https://ice.it/saul",
  bookingsMonth: "April",
  extendedBookingsDate: "06/04",
  icsFile: "icsFile.ics",
  deadline: "April 26",
};
