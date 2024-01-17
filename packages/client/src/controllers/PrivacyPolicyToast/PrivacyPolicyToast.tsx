import React from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Routes } from "@eisbuk/shared/ui";
import { PrivacyPolicyToast as Toast } from "@eisbuk/ui";

import { getIsAdmin } from "@/store/selectors/auth";
import { getPrivacyPolicy } from "@/store/selectors/orgInfo";
import { getBookingsCustomer } from "@/store/selectors/bookings";
import { getSecretKey } from "@/store/selectors/app";

import { acceptPrivacyPolicy } from "@/store/actions/bookingOperations";

const PrivacyPolicyToast: React.FC = () => {
  const history = useHistory();

  const policyParams = useSelector(getPrivacyPolicy);

  const secretKey = useSelector(getSecretKey) || "";
  const bookingsCustomer = useSelector(getBookingsCustomer(secretKey)) || {};

  const policyAccepted = Boolean(bookingsCustomer.privacyPolicyAccepted);
  const isAdmin = useSelector(getIsAdmin);

  const dispatch = useDispatch();

  const accept = () =>
    dispatch(acceptPrivacyPolicy({ ...bookingsCustomer, secretKey }));

  return (
    <Toast
      show={Boolean(
        !policyAccepted && !isAdmin && secretKey && bookingsCustomer?.id
      )}
      policyParams={policyParams}
      onLearnMore={() => history.push(Routes.PrivacyPolicy)}
      onAccept={accept}
    />
  );
};

export default PrivacyPolicyToast;
