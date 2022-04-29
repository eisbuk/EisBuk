import { EmailMessage } from "@eisbuk/shared";

export interface TransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SMTPSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

export type SendEmailObject = EmailMessage & { from: string };
