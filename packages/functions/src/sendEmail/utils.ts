import admin from "firebase-admin";
import {
  Collection,
  OrganizationData,
  EmailTemplate,
  EmailType,
  ClientEmailPayload,
  interpolateEmailTemplate,
  EmailAttachment,
} from "@eisbuk/shared";

import { EisbukHttpsError, validateJSON } from "../utils";
import {
  SendBookingsLinkEmailSchema,
  SendExtendDateEmailSchema,
  SendICSEmailSchema,
} from "./validations";

export const fetchOrganizationEmailTemplate: (
  organization: string,
  emailType: EmailType
) => Promise<EmailTemplate> = async (organization, emailType) => {
  const orgData = await admin
    .firestore()
    .doc(`${Collection.Organizations}/${organization}`)
    .get();

  const { emailTemplates } = orgData.data() as OrganizationData;

  const emailTemplate = emailTemplates![emailType];

  return emailTemplate;
};

export const createBookingsEmailPayload = (
  emailPayload: ClientEmailPayload[EmailType.SendBookingsLink],
  template: EmailTemplate
): { html: string; subject: string } => {
  // Validate payload and throw if not a valid schema
  const [sendBookingsLinkEmail, sendBookingsLinkEmailErrors] = validateJSON(
    SendBookingsLinkEmailSchema,
    {
      ...emailPayload,
    },
    "Constructing gave following errors (check the email payload and organization preferences):"
  );
  if (sendBookingsLinkEmailErrors) {
    throw new EisbukHttpsError(
      "invalid-argument",
      sendBookingsLinkEmailErrors.join(" ")
    );
  }

  const { name, surname } = sendBookingsLinkEmail.customer;

  const subjectFieldValues = {
    displayName: sendBookingsLinkEmail.displayName,
  };
  const htmlFieldValues = {
    displayName: sendBookingsLinkEmail.displayName,
    name: `${name} ${surname}`,
    bookingsLink: sendBookingsLinkEmail.bookingsLink,
  };
  const interpolatedHtml = interpolateEmailTemplate(
    template.html,
    htmlFieldValues
  );
  const interpolatedSubject = interpolateEmailTemplate(
    template.subject,
    subjectFieldValues
  );

  return {
    subject: interpolatedSubject,
    html: interpolatedHtml,
  };
};
export const createICSFileEmailPayload = (
  emailPayload: ClientEmailPayload[EmailType.SendCalendarFile],
  template: EmailTemplate
): { html: string; subject: string; attachments: EmailAttachment[] } => {
  // Validate payload and throw if not a valid schema
  const [sendICSFileEmail, sendICSFileEmailErrors] = validateJSON(
    SendICSEmailSchema,
    {
      ...emailPayload,
    },
    "Constructing gave following errors (check the email payload and organization preferences):"
  );
  if (sendICSFileEmailErrors) {
    throw new EisbukHttpsError(
      "invalid-argument",
      sendICSFileEmailErrors.join(" ")
    );
  }

  const { name, surname } = sendICSFileEmail.customer;

  const subjectFieldValues = {
    displayName: sendICSFileEmail.displayName,
  };
  const htmlFieldValues = {
    displayName: sendICSFileEmail.displayName,
    name: `${name} ${surname}`,
    icsFile: sendICSFileEmail.attachments.filename,
  };
  const interpolatedHtml = interpolateEmailTemplate(
    template.html,
    htmlFieldValues
  );
  const interpolatedSubject = interpolateEmailTemplate(
    template.subject,
    subjectFieldValues
  );

  return {
    subject: interpolatedSubject,
    html: interpolatedHtml,
    attachments: [
      {
        filename: sendICSFileEmail.attachments.filename,
        content: sendICSFileEmail.attachments.content,
      },
    ],
  };
};
export const createExtendDateEmailPayload = (
  emailPayload: ClientEmailPayload[EmailType.SendExtendedBookingLink],
  template: EmailTemplate
): { html: string; subject: string } => {
  // Validate payload and throw if not a valid schema
  const [sendExtendDateEmail, sendExtendDateEmailErrors] = validateJSON(
    SendExtendDateEmailSchema,
    {
      ...emailPayload,
    },
    "Constructing gave following errors (check the email payload and organization preferences):"
  );
  if (sendExtendDateEmailErrors) {
    throw new EisbukHttpsError(
      "invalid-argument",
      sendExtendDateEmailErrors.join(" ")
    );
  }

  const { name, surname } = sendExtendDateEmail.customer;

  const subjectFieldValues = {
    displayName: sendExtendDateEmail.displayName,
  };
  const htmlFieldValues = {
    displayName: sendExtendDateEmail.displayName,
    name: `${name} ${surname}`,
    bookingsMonth: sendExtendDateEmail.bookingsMonth,
    extendedBookingsDate: sendExtendDateEmail.extendedBookingsDate,
  };
  const interpolatedHtml = interpolateEmailTemplate(
    template.html,
    htmlFieldValues
  );
  const interpolatedSubject = interpolateEmailTemplate(
    template.subject,
    subjectFieldValues
  );

  return {
    subject: interpolatedSubject,
    html: interpolatedHtml,
  };
};
