import React from "react";
import { useSelector } from "react-redux";

import { PrivacyPolicyToast as Toast } from "@eisbuk/ui";

import { getIsAdmin } from "@/store/selectors/auth";

const PrivacyPolicyToast: React.FC = () => {
  const [accepted, setAccepted] = React.useState(false);
  const isAdmin = useSelector(getIsAdmin);

  return (
    <Toast show={!accepted && !isAdmin} onAccept={() => setAccepted(true)} />
  );
};

export default PrivacyPolicyToast;
