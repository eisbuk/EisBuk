import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { Routes } from "@eisbuk/shared/ui";
import { PrivacyPolicyToast as Toast } from "@eisbuk/ui";

import { getIsAdmin } from "@/store/selectors/auth";
import { getPrivacyPolicy } from "@/store/selectors/orgInfo";

const PrivacyPolicyToast: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const [accepted, setAccepted] = React.useState(false);
  const isPrivacyPolicyRoute = React.useMemo(
    () => location.pathname === Routes.PrivacyPolicy,
    [location.pathname]
  );
  const isAdmin = useSelector(getIsAdmin);
  const policyParams = useSelector(getPrivacyPolicy);

  return (
    <Toast
      show={!accepted && !isAdmin && !isPrivacyPolicyRoute}
      policyParams={policyParams}
      onLearnMore={() => history.push(Routes.PrivacyPolicy)}
      onAccept={() => setAccepted(true)}
    />
  );
};

export default PrivacyPolicyToast;
