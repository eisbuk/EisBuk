import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { AthletesApproval } from "@eisbuk/ui";
import { PrivateRoutes } from "@eisbuk/shared/ui";

import { getCustomerByNoCategories } from "@/store/selectors/customers";

const AthletesApprovalController: React.FC = () => {
  const history = useHistory();

  const customers = useSelector(getCustomerByNoCategories());

  const goToAthletesApproval = () => {
    history.push(`${PrivateRoutes.Athletes}/?approvals=true`);
  };

  return (
    <AthletesApproval customers={customers} onClick={goToAthletesApproval} />
  );
};

export default AthletesApprovalController;
