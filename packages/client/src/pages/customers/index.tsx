import React from "react";
import { useSelector } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import { DateTime } from "luxon";

import { OrgSubCollection, Customer, __addAthleteId__ } from "@eisbuk/shared";
import { Layout, CustomerGrid, SearchBar } from "@eisbuk/ui";
import {
  useTranslation,
  NavigationLabel,
  ActionButton,
} from "@eisbuk/translations";
import { Plus } from "@eisbuk/svg";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { PrivateRoutes } from "@/enums/routes";

import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import {
  getCustomersByBirthday,
  getCustomersList,
} from "@/store/selectors/customers";

import useTitle from "@/hooks/useTitle";

import { isEmpty } from "@/utils/helpers";
import { getOrganization } from "@/lib/getters";

import { adminLinks } from "@/data/navigation";

const AthletesPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Customers },
  ]);

  useTitle(t(NavigationLabel.Athletes));

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  const customers = useSelector(getCustomersList(true));

  // Search logic
  const [filterString, setFilterString] = React.useState("");

  const openCustomerCard = ({ id }: Customer) => {
    history.push(`${PrivateRoutes.Athletes}/${id}`);
  };

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <div className="content-container !pt-16">
        {!isEmpty(customers) && (
          <>
            <SearchBar
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />

            <CustomerGrid
              onCustomerClick={openCustomerCard}
              filterString={filterString}
              {...{ customers }}
            />
          </>
        )}

        <Link to={PrivateRoutes.NewAthlete}>
          <button
            data-testid={__addAthleteId__}
            aria-label={t(ActionButton.AddAthlete)}
            className="fixed right-10 bottom-10 rounded-full bg-cyan-600 shadow-lg h-14 w-14 p-4 text-white"
          >
            <Plus />
          </button>
        </Link>
      </div>
    </Layout>
  );
};

export default AthletesPage;
