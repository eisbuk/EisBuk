import React from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Redirect, useHistory } from "react-router-dom";

import { CustomerProfileForm, CustomerFormVariant, Layout } from "@eisbuk/ui";
import {
  CustomerLabel,
  useTranslation,
  ValidationMessage,
} from "@eisbuk/translations";

import { Routes } from "@/enums/routes";

import { getOrganization } from "@/lib/getters";

import Loading from "@/components/auth/Loading";
import { NotificationsContainer } from "@/features/notifications/components";

import {
  getAuthEmail,
  getIsAuthEmpty,
  getIsAuthLoaded,
} from "@/store/selectors/auth";

import { signOut } from "@/store/actions/authOperations";
import { customerSelfRegister } from "@/store/actions/bookingOperations";
import { getOrgDisplayName } from "@/store/selectors/orgInfo";

const SelfRegisterPage: React.FC = () => {
  const history = useHistory();
  const { getState } = useStore();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const organization = getOrganization();
  const orgDisplayName = useSelector(getOrgDisplayName);
  const isAuthLoaded = useSelector(getIsAuthLoaded);
  const isAuthEmpty = useSelector(getIsAuthEmpty);
  const email = useSelector(getAuthEmail);

  // The thunk is called explicitly (without dispatch) as we want to leverage the async behaviour
  // of the thunk and return a promise which then gets awaited by 'CustomerForm's internal 'Formik'
  // to more correctly control the 'isSubmitting' state
  const submitForm: Parameters<
    typeof CustomerProfileForm
  >[0]["onSave"] = async (values, { setErrors }) => {
    const { secretKey, codeOk } = await customerSelfRegister(values)(
      dispatch,
      getState
    );
    if (!codeOk) {
      setErrors({
        registrationCode: t(ValidationMessage.InvalidRegistrationCode),
      });
    }

    if (secretKey) {
      history.push([Routes.CustomerArea, secretKey].join("/"));
    }
  };

  const logOut = () => dispatch(signOut());

  if (!isAuthLoaded) {
    return <Loading />;
  }

  // If auth is empty, this is either a mistake, or the user is trying to access the page directly.
  // In either case, redirect to login (and register) page.
  if (isAuthEmpty) {
    return <Redirect to={Routes.Login} />;
  }

  // This should virtually never happen, but if it does, something went wrong
  // Show unauth page
  if (!email) {
    return <Redirect to={Routes.Unauthorized} />;
  }

  return (
    <Layout Notifications={NotificationsContainer}>
      <div className="content-container w-full mx-auto">
        <div className="py-24 px-11">
          <div className="mb-28">
            <h1 className="text-3xl text-gray-700 mb-2.5">
              {t(CustomerLabel.Welcome, {
                displayName: orgDisplayName || organization,
              })}
            </h1>
            <p className="text-gray-500">{t(CustomerLabel.FillTheForm)}</p>
          </div>
          <CustomerProfileForm
            onCancel={logOut}
            onSave={submitForm}
            customer={{ email }}
            variant={CustomerFormVariant.SelfRegistration}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SelfRegisterPage;
