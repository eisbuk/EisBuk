import { EmailMessage } from "./firestore";

export interface SendMailPayload extends EmailMessage {
  organization: string;
  subject: string;
}
