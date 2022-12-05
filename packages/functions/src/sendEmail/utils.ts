import admin from "firebase-admin";
import {
  Collection,
  OrganizationData,
  EmailTemplate,
  EmailTemplates,
  HTTPSErrors,
} from "@eisbuk/shared";

import { EisbukHttpsError } from "../utils";

export const fetchOrganizationEmailTemplate: (
  organization: string,
  emailTemplateName: EmailTemplates
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
