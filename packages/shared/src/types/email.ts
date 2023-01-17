import { EmailType } from "../enums/email";

export interface EmailTypePayload {
  [EmailType.SendBookingsLink]: {
    type: EmailType.SendBookingsLink;
    organization: string;
    bookingsLink: string;
    customer: SendBookingsLinkCustomer;
  };
  [EmailType.SendCalendarFile]: {
    type: EmailType.SendCalendarFile;
    organization: string;
    customer: SendCalendarFileCustomer;
    attachments: {
      filename: string;
      content: string | Buffer;
    };
  };
  [EmailType.SendExtendedBookingsDate]: {
    type: EmailType.SendExtendedBookingsDate;
    organization: string;
    bookingsMonth: string;
    extendedBookingsDate: string;
    customer: SendExtendedBookingLinkCustomer;
  };
}

export interface EmailTypeButtons {
  [EmailType.SendBookingsLink]: {
    organizationName: string;
    bookingsLink: string;
    name: string;
    surname: string;
  };
  [EmailType.SendCalendarFile]: {
    organizationName: string;
    name: string;
    surname: string;
    calendarFile: string;
  };
  [EmailType.SendExtendedBookingsDate]: {
    organizationName: string;
    bookingsMonth: string;
    extendedBookingsDate: string;
    name: string;
    surname: string;
  };
}

export interface SendExtendedBookingLinkCustomer {
  name: string;
  surname: string;
  email: string;
}
export interface SendBookingsLinkCustomer {
  name: string;
  surname: string;
  email: string;
}
export interface SendCalendarFileCustomer {
  name: string;
  surname: string;
  email: string;
  secretKey: string;
}
