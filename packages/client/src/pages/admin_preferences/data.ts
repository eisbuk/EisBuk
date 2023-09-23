import { ClientMessageType } from "@eisbuk/shared";

import { EmailTemplateLabel } from "@eisbuk/translations";

export const buttons = {
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
