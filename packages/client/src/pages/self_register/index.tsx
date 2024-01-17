import React from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Redirect, useHistory } from "react-router-dom";
import { getFirestore } from "@firebase/firestore";

import {
  CustomerLabel,
  useTranslation,
  ValidationMessage,
} from "@eisbuk/translations";
import { CustomerForm, LayoutContent } from "@eisbuk/ui";

import { functions } from "@/setup";

import { Routes } from "@eisbuk/shared/ui";

import { getOrganization } from "@/lib/getters";

import Layout from "@/controllers/Layout";
import Loading from "@/components/auth/Loading";

import {
  getAuthEmail,
  getAuthPhoneNumber,
  getIsAuthEmpty,
  getIsAuthLoaded,
  getLocalAuth,
} from "@/store/selectors/auth";

import { signOut, updateAuthUser } from "@/store/actions/authOperations";
import { customerSelfRegister } from "@/store/actions/bookingOperations";
import {
  getDefaultCountryCode,
  getOrgDisplayName,
} from "@/store/selectors/orgInfo";
import { FirestoreVariant } from "@/utils/firestore";

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
  const phone = useSelector(getAuthPhoneNumber);
  const defaultCountryCode = useSelector(getDefaultCountryCode);

  // The thunk is called explicitly (without dispatch) as we want to leverage the async behaviour
  // of the thunk and return a promise which then gets awaited by 'CustomerForm's internal 'Formik'
  // to more correctly control the 'isSubmitting' state
  const submitForm: Parameters<
    typeof CustomerForm.SelfReg
  >[0]["onSave"] = async (values, { setErrors, setSubmitting }) => {
    const { secretKey, codeOk } = await customerSelfRegister(values)(
      dispatch,
      getState,
      {
        getFirestore: () =>
          FirestoreVariant.client({ instance: getFirestore() }),
        getFunctions: () => functions,
      }
    );
    try {
      if (!codeOk) {
        setErrors({
          registrationCode: t(ValidationMessage.InvalidRegistrationCode),
        });
        setSubmitting(false);
      }
    } finally {
      setSubmitting(false);
    }

    if (secretKey) {
      await updateAuthUser(getLocalAuth(getState()))(dispatch, getState, {
        getFirestore: () =>
          FirestoreVariant.client({ instance: getFirestore() }),
        getFunctions: () => functions,
      } as any);
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
  if (!email && !phone) {
    return <Redirect to={Routes.Unauthorized} />;
  }

  return (
    <Layout>
      <LayoutContent>
        <div className="w-full mx-auto">
          <div className="py-24 px-11">
            <div className="mb-28">
              <h1 className="text-3xl text-gray-700 mb-2.5">
                {t(CustomerLabel.Welcome, {
                  displayName: orgDisplayName || organization,
                })}
              </h1>
              <p className="text-gray-500">{t(CustomerLabel.FillTheForm)}</p>
            </div>
            <CustomerForm.SelfReg
              onCancel={logOut}
              onSave={submitForm}
              customer={{ email, phone }}
              defaultDialCode={defaultCountryCode}
            />
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default SelfRegisterPage;
