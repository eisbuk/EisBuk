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

import AdminBar from "@/controllers/AdminBar";
import { NotificationsContainer } from "@/features/notifications/components";

import { getCustomersList } from "@/store/selectors/customers";

import useTitle from "@/hooks/useTitle";

import { isEmpty } from "@/utils/helpers";
import { getOrganization } from "@/lib/getters";

const AthletesPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  useTitle(t(NavigationLabel.Athletes));

  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Customers },
  ]);

  // Approvals only display logic
  const [approvalsOnly, setApprovalsOnly] = useState(true);

  useEffect(() => {
    setApprovalsOnly(history.location.search === "?approvals=true");
  }, [history.location.search]);

  const toggleApprovals = () =>
    history.location.search === "?approvals=true"
      ? history.push(`${PrivateRoutes.Athletes}`)
      : history.push(`${PrivateRoutes.Athletes}/?approvals=true`);

  const customers = useSelector(getCustomersList(true));

  // Search logic
  const [filterString, setFilterString] = React.useState("");

  const openCustomerCard = ({ id }: Customer) => {
    history.push(`${PrivateRoutes.Athletes}/${id}`);
  };

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <div className="absolute top-0 right-0 left-0 flex flex-col pb-[70px] pt-[72px] md:pt-[272px]">
      <header className="fixed left-0 top-0 right-0 bg-gray-800 z-50">
        <div className="content-container">
          <AdminBar className="flex w-full h-[70px] py-[15px] justify-between items-center print:hidden" />

          <div className="hidden w-full h-[70px] py-[15px] justify-between items-center md:flex print:hidden">
            <div>{null}</div>
            {null}
          </div>

          <div className="w-full h-[2px] bg-gray-700" />

          <div className="hidden w-full h-[70px] justify-between items-center md:flex print:hidden">
            <div className="w-full flex items-center gap-3 justify-start max-w-1/2">
              {null}
            </div>

            <div className="hidden md:block md:w-full">
              <NotificationsContainer className="w-full md:w-auto" />
            </div>
          </div>
        </div>
      </header>

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
                  color={approvalsOnly ? ButtonColor.Primary : undefined}
                  className={[
                    "h-8 hidden md:flex whitespace-nowrap",
                    !approvalsOnly
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
                {...{ customers, approvalsOnly }}
              />
            </>
          )}

          <div className="fixed bottom-0 w-full flex justify-between items-center -mx-4 px-2 py-1.5 bg-ice-300 z-40 border-t border-gray-300 md:hidden">
            <Button
              aria-label={t(AdminAria.AthletesApprovalButton)}
              onClick={toggleApprovals}
              color={approvalsOnly ? ButtonColor.Primary : undefined}
              className={`h-8 ${approvalsOnly ? "" : "!text-gray-600 outline outline-gray-300"
                }`}
            >
              {t(AdminAria.AthletesApprovalButton)}
            </Button>

            <Link to={PrivateRoutes.NewAthlete}>
              <Button
                data-testid={testId("add-athlete")}
                aria-label={t(ActionButton.AddAthlete)}
                className="h-11 text-gray-600"
              >
                <span className="text-md">{t(ActionButton.AddAthlete)}</span>{" "}
                <span className="w-8 h-8">
                  <Plus />
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <div className={`fixed px-4 bottom-[70px] right-0 z-40 md:hidden`}>
          <NotificationsContainer />
        </div>
      </LayoutContent>
    </div>
  );
};

export default AthletesPage;
