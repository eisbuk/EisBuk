export interface SMSRecipient {
  msisdn: string;
}

export interface SMS {
  message: string;
  smsFrom: string;
  recipients: SMSRecipient[];
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
