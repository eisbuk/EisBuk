import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  useFirestoreSubscribe,
  useUpdateSubscription,
} from "@eisbuk/react-redux-firebase-firestore";
import { OrgSubCollection } from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";
import { LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";

import ErrorBoundary from "@/components/atoms/ErrorBoundary";

import { getOrganization } from "@/lib/getters";

import { getAllSecretKeys } from "@/store/selectors/auth";
import { getOtherBookingsAccounts } from "@/store/selectors/bookings";

const SelectAccount: React.FC = () => {
  const secretKeys = useSelector(getAllSecretKeys) || [];
  const accounts = useSelector(getOtherBookingsAccounts(""));

  // Subscribe to necessary collections
  useFirestoreSubscribe(getOrganization(), [
    {
      collection: OrgSubCollection.Bookings,
      meta: { secretKeys },
    },
  ]);

  useUpdateSubscription(
    { collection: OrgSubCollection.Bookings, meta: { secretKeys } },
    [secretKeys]
  );

  return (
    <Layout>
      <LayoutContent>
        <ErrorBoundary resetKeys={[]}>
          <div className="px-[44px] py-4">
            <h1 className="mt-20 text-2xl font-normal leading-none text-gray-700 cursor-normal select-none mb-12">
              Select account
            </h1>
            <div className="w-full grid grid-cols-12 gap-5 ">
              {accounts?.map((account) => (
                <Link
                  className="rounded border border-gray-300 py-4 px-8 col-span-3 hover:bg-gray-50 hover:border-gray-700"
                  to={`${Routes.CustomerArea}/${account.secretKey}`}
                >
                  <span className="text-lg text-gray-700">{account.name}</span>
                  <br />
                  <span className="text-lg text-gray-700">
                    {account.surname}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </ErrorBoundary>
      </LayoutContent>
    </Layout>
  );
};

export default SelectAccount;
