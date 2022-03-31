import { EmailMessage, SMSMessage } from "./firestore";
export interface SendMailPayload extends EmailMessage {
    organization: string;
    subject: string;
}
export interface SendSMSPayload extends SMSMessage {
    organization: string;
}
