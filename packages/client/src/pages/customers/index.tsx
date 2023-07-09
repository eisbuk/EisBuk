import React from "react";
import { useSelector } from "react-redux";
import { Link, useHistory } from "react-router-dom";

import { OrgSubCollection, Customer } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import { CustomerGrid, SearchBar, LayoutContent } from "@eisbuk/ui";
import {
  useTranslation,
  NavigationLabel,
  ActionButton,
} from "@eisbuk/translations";
import { Plus } from "@eisbuk/svg";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { testId } from "@eisbuk/testing/testIds";

import Layout from "@/controllers/Layout";

import { getCustomersList } from "@/store/selectors/customers";

import useTitle from "@/hooks/useTitle";

import { isEmpty } from "@/utils/helpers";
import { getOrganization } from "@/lib/getters";

const AthletesPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Customers },
  ]);

  useTitle(t(NavigationLabel.Athletes));

  const customers = useSelector(getCustomersList(true));

  // Search logic
  const [filterString, setFilterString] = React.useState("");

  const openCustomerCard = ({ id }: Customer) => {
    history.push(`${PrivateRoutes.Athletes}/${id}`);
  };

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <Layout>
      <LayoutContent>
        <div className="!pt-16">
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
              data-testid={testId("add-athlete")}
              aria-label={t(ActionButton.AddAthlete)}
              className="fixed right-10 bottom-10 rounded-full bg-cyan-600 shadow-lg h-14 w-14 p-3 text-white"
            >
              <Plus />
            </button>
          </Link>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default AthletesPage;
