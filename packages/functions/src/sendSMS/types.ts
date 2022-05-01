/* eslint-disable camelcase */

export interface SMSResponse {
  ids?: string[];
  usage?: {
    currency: string;
    // eslint-disable-next-line camelcase
    total_cost: number;
    countries: Record<string, unknown>;
  };
}

export interface SendSMSObject {
  message: string;
  smsFrom: string;
  recipients: { msisdn: string }[];
  callback_url?: string;
}

/**
 * The payload of a callback request sent from GatewayAPI to update
 * the SMS delivery status
 */
export interface SMSStatusPayload {
  /** The ID of the SMS the notification concerns */
  id: number;
  /** The MSISDN of the mobile recipient. */
  msisdn: number;
  /** The UNIX Timestamp for the delivery status event */
  time: number;
  /** One of the states, in all-caps, ie. DELIVERED */
  status: string;
  /** Optional error description, if available. */
  error: string;
  /** Optional numeric code, in hex, see SMS Errors, if available. */
  code: string;
  /** If you specified a reference when sending the message, it is returned to you */
  userref: string;
  /** Optional country code of the msisdn. */
  country_code: string;
  /** Optional country prefix of the msisdn. */
  country_prefix: number;
}
