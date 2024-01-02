import { ClientMessageMethod, ClientMessageType } from "../enums/clientMessage";

interface ClientData {
  name: string;
  surname: string;
}

interface AdditionalClientDataLookup {
  [ClientMessageMethod.Email]: {
    email: string;
  };
  [ClientMessageMethod.SMS]: {
    phone: string;
  };
}

interface AdditionalMessageDataLookup {
  [ClientMessageType.SendBookingsLink]: {
    bookingsLink: string;
    deadline?: string;
  };
  [ClientMessageType.SendCalendarFile]: {
    secretKey: string;
    attachments: {
      filename: string;
      content: string | Buffer;
    };
  };
  [ClientMessageType.SendExtendedBookingsDate]: {
    bookingsMonth: string;
    extendedBookingsDate: string;
  };
}

type ClientMessagePayloadLookup = {
  [T in ClientMessageType]: {
    type: T;
    organization: string;
  } & AdditionalMessageDataLookup[T];
};

export type ClientMessagePayload<
  M extends ClientMessageMethod,
  C extends ClientMessageType = ClientMessageType
> = ClientData & AdditionalClientDataLookup[M] & ClientMessagePayloadLookup[C];

export interface EmailInterpolationValues {
  [key: string]: string | undefined;
  organizationName: string;
  name: string;
  surname: string;
  bookingsLink?: string;
  deadline?: string;
  calendarFile?: string;
  bookingsMonth?: string;
  extendedBookingsDate?: string;
}
