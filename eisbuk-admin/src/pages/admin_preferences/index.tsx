import React from "react";
import { useSelector } from "react-redux";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import AppbarAdmin from "@/components/layout/AppbarAdmin";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { getOrganizationSettings } from "@/store/selectors/app";

import OrganizationSettings from "@/components/atoms/OrganizationSettings/OrganizationSettings";

const AdminPreferencesPage: React.FC = () => {
  useFirestoreSubscribe([Collection.Organizations, OrgSubCollection.Customers]);

  const organization = useSelector(getOrganizationSettings);

  return (
    <>
      <AppbarAdmin />
      <OrganizationSettings organization={organization} />
    </>
  );
};

export default AdminPreferencesPage;
