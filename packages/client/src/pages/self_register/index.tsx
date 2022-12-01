import React from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Redirect, useHistory } from "react-router-dom";

import { CustomerProfileForm, CustomerFormVariant, Layout } from "@eisbuk/ui";
import { CustomerLabel, useTranslation } from "@eisbuk/translations";
import { CustomerBase } from "@eisbuk/shared";

import { Routes } from "@/enums/routes";

import { getOrganization } from "@/lib/getters";

import Loading from "@/components/auth/Loading";
import { NotificationsContainer } from "@/features/notifications/components";

import { getAuthEmail, getIsAuthLoaded } from "@/store/selectors/auth";

import { signOut } from "@/store/actions/authOperations";
import { customerSelfRegister } from "@/store/actions/bookingOperations";

const SelfRegisterPage: React.FC = () => {
  const history = useHistory();
  const { getState } = useStore();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const organization = getOrganization();
  const isAuthLoaded = useSelector(getIsAuthLoaded);
  const email = useSelector(getAuthEmail);

  // The think is called explicitly (without dispatch) as we want to leverage the async behavioud
  // of the thunk and return a promise which then gets awaited by 'CustomerForm's internal 'Formik'
  // to more correctly control the 'isSubmitting' state
  const submitForm = async (
    values: CustomerBase & { registrationCode: string }
  ) => {
    const { secretKey } = await customerSelfRegister(values)(
      dispatch,
      getState
    );
    if (secretKey) {
      history.push([Routes.CustomerArea, secretKey].join("/"));
    }
  };

  const logOut = () => dispatch(signOut());

  if (!isAuthLoaded) {
    return <Loading />;
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
                displayName:
                  /** @TODO organization display name here probably */
                  organization,
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
