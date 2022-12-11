import { EmailType } from "../enums/email";

interface EmailTypePayload {
  [EmailType.SendBookingsLink]: {
    type: EmailType.SendBookingsLink;
    organization: string;
    displayName: string;
    bookingsLink: string;
    customer: {
      name: string;
      surname: string;
      secretKey: string;
      email: string;
    };
  };
  [EmailType.SendCalendarFile]: {
    type: EmailType.SendCalendarFile;
    organization: string;
    displayName: string;
    customer: {
      name: string;
      surname: string;
      secretKey: string;
      email: string;
    };
    attachments: {
      filename: string;
      content: string;
    };
  };
  [EmailType.SendExtendedBookingLink]: {
    type: EmailType.SendExtendedBookingLink;
    organization: string;
    displayName: string;
    bookingsMonth: string;
    extendedBookingsDate: string;
    customer: {
      name: string;
      surname: string;
      email: string;
    };
  };
}

export type ClientEmailPayload = {
  [T in EmailType]: EmailTypePayload[T];
};
