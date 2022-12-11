import admin from "firebase-admin";
import {
  Collection,
  OrganizationData,
  EmailTemplate,
  HTTPSErrors,
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
) => Promise<EmailTemplate> = async (organization, emailTemplateName) => {
  const { emailTemplates } = (
    await admin
      .firestore()
      .doc(`${Collection.Organizations}/${organization}`)
      .get()
  ).data() as OrganizationData;

  if (!emailTemplates) {
    throw new EisbukHttpsError("unavailable", HTTPSErrors.NoConfiguration);
  }

  const emailTemplate = emailTemplates[emailTemplateName];

  return emailTemplate;
};

export const createBookingsEmailPayload = (
  emailPayload: ClientEmailPayload[EmailType.SendBookingsLink],
  template: EmailTemplate
): { html: string; subject: string } => {
  validateJSON(SendBookingsLinkEmailSchema, emailPayload);

  const { name, surname } = emailPayload.customer;

  const subjectFieldValues = {
    displayName: emailPayload.displayName,
  };
  const htmlFieldValues = {
    displayName: emailPayload.displayName,
    name: `${name} ${surname}`,
    bookingsLink: emailPayload.bookingsLink,
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
  validateJSON(SendICSEmailSchema, emailPayload);

  const { name, surname } = emailPayload.customer;

  const subjectFieldValues = {
    displayName: emailPayload.displayName,
  };
  const htmlFieldValues = {
    displayName: emailPayload.displayName,
    name: `${name} ${surname}`,
    ICSFile: emailPayload.attachments.filename,
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
        filename: emailPayload.attachments.filename,
        content: emailPayload.attachments.content,
      },
    ],
  };
};
export const createExtendDateEmailPayload = (
  emailPayload: ClientEmailPayload[EmailType.SendExtendedBookingLink],
  template: EmailTemplate
): { html: string; subject: string } => {
  validateJSON(SendExtendDateEmailSchema, emailPayload);

  const { name, surname } = emailPayload.customer;

  const subjectFieldValues = {
    displayName: emailPayload.displayName,
  };
  const htmlFieldValues = {
    displayName: emailPayload.displayName,
    name: `${name} ${surname}`,
    bookingsMonth: emailPayload.bookingsMonth,
    extendedBookingsDate: emailPayload.extendedBookingsDate,
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
