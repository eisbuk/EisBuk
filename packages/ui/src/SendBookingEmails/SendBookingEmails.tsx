import React from "react";

import { useTranslation, AdminAria } from "@eisbuk/translations";
import { Mail } from "@eisbuk/svg";

import Button from "../Button";

interface SendBookingEmailsProps {
  onClick?: () => void;
}

const SendBookingEmails: React.FC<SendBookingEmailsProps> = ({
  onClick = () => {},
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative cursor-pointer select-none">
      <div className="relative group" onClick={onClick}>
        <Button
          className="h-11 w-11 !p-2 group-hover:bg-white/10"
          aria-label={t(AdminAria.SendBookingEmailsButton)}
        >
          <Mail />
        </Button>
      </div>
    </div>
  );
};

export default SendBookingEmails;
