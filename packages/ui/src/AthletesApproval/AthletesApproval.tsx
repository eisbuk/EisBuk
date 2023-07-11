import React from "react";

import { useTranslation, AdminAria } from "@eisbuk/translations";
import { Customer } from "@eisbuk/shared";
import { ClipboardCheck } from "@eisbuk/svg";

import Button from "../Button";

interface AthletesApprovalProps {
  customers: Customer[];
  onClick?: () => void;
}

const AthletesApproval: React.FC<AthletesApprovalProps> = ({
  customers,
  onClick = () => {},
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative cursor-pointer select-none">
      <div className="relative group" onClick={onClick}>
        <Button
          className="h-11 w-11 !p-2 group-hover:bg-white/10"
          aria-label={t(AdminAria.AthletesApprovalIcon)}
        >
          <ClipboardCheck />
        </Button>

        {Boolean(customers.length) && (
          <div
            className="absolute w-5 h-5 p-px flex justify-center items-center top-0 right-0 text-sm text-white bg-red-400 rounded-full"
            data-testid="approval-badge"
          >
            {customers.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default AthletesApproval;
