import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router-dom";

import { CustomerProfileForm, CustomerFormVariant, Layout } from "@eisbuk/ui";
import { CustomerLabel, useTranslation } from "@eisbuk/translations";

import { Routes } from "@/enums/routes";

import { getOrganization } from "@/lib/getters";

import { getAuthEmail, getIsAuthLoaded } from "@/store/selectors/auth";

import { signOut } from "@/store/actions/authOperations";

import Loading from "@/components/auth/Loading";

const SelfRegisterPage: React.FC = () => {
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const organization = getOrganization();
  const isAuthLoaded = useSelector(getIsAuthLoaded);
  const email = useSelector(getAuthEmail);

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
    <Layout>
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
            onSave={() => {}}
            customer={{ email }}
            variant={CustomerFormVariant.SelfRegistration}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SelfRegisterPage;
