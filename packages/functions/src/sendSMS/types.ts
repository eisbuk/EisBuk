export interface SMSRecipient {
  msisdn: string;
}

export interface SendSMSObject {
  message: string;
  smsFrom: string;
  recipients: SMSRecipient[];
}

export interface CheckSMSRes {
  recipients: {
    dsnstatus: string;
    dsnerror: string;
  }[];
}

export interface SMSResponse {
  ids?: string[];
  usage?: {
    currency: string;
    // eslint-disable-next-line camelcase
    total_cost: number;
    countries: Record<string, unknown>;
  };
}
