export interface TransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
}

export interface SMTPPreferences {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}
