import React from "react";
import { useHistory } from "react-router-dom";

import { SendBookingEmails } from "@eisbuk/ui";
import { PrivateRoutes } from "@eisbuk/shared/ui";

const SendBookingEmailsController: React.FC = () => {
  const history = useHistory();

  const goToSendBookingEmails = () => {
    history.push(`${PrivateRoutes.BookingEmails}`);
  };

  return <SendBookingEmails onClick={goToSendBookingEmails} />;
};

export default SendBookingEmailsController;
