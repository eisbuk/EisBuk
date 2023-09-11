import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useHistory } from "react-router-dom";

import { OrgSubCollection, Customer } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import {
  CustomerGrid,
  SearchBar,
  LayoutContent,
  Button,
  ButtonColor,
} from "@eisbuk/ui";
import {
  useTranslation,
  NavigationLabel,
  ActionButton,
  AdminAria,
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

  const [toggled, setToggle] = useState(true);

  useEffect(() => {
    setToggle(
      history.location.search !== "" &&
        history.location.search === "?approvals=true"
    );
  }, [history.location.search]);

  useTitle(t(NavigationLabel.Athletes));

  const customers = useSelector(getCustomersList(true));

  // Search logic
  const [filterString, setFilterString] = React.useState("");

  const openCustomerCard = ({ id }: Customer) => {
    history.push(`${PrivateRoutes.Athletes}/${id}`);
  };

  const toggleApprovals = () => {
    const toggled =
      history.location.search && history.location.search === "?approvals=true";
    toggled
      ? history.push(`${PrivateRoutes.Athletes}`)
      : history.push(`${PrivateRoutes.Athletes}/?approvals=true`);
  };

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <Layout>
      <LayoutContent>
        <div className="!pt-16">
          {!isEmpty(customers) && (
            <>
              <div className="flex w-full items-center justify-between">
                <SearchBar
                  value={filterString}
                  onChange={(e) => setFilterString(e.target.value)}
                />
                <Button
                  aria-label={t(AdminAria.AthletesApprovalButton)}
                  onClick={toggleApprovals}
                  color={toggled ? ButtonColor.Primary : undefined}
                  className={[
                    "h-8",
                    !toggled
                      ? "!text-black outline outline-gray-300 border-box"
                      : "",
                  ].join(" ")}
                >
                  {t(AdminAria.AthletesApprovalButton)}
                </Button>
              </div>

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
