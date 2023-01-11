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

export interface EmailInterpolationValues {
  organizationName: string;
  name: string;
  surname: string;
  bookingsLink?: string;
  icsFile?: string;
  bookingsMonth?: string;
  extendedBookingsDate?: string;
}
