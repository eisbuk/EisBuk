import React from "react";
import { useSelector } from "react-redux";

import Fab from "@mui/material/Fab";
import Grid from "@mui/material/Grid";

import AddIcon from "@mui/icons-material/Add";

import makeStyles from "@mui/styles/makeStyles";

import { ETheme } from "@/themes";

import { OrgSubCollection } from "@eisbuk/shared";
import { Layout } from "@eisbuk/ui";
import {
  useTranslation,
  ActionButton,
  NavigationLabel,
} from "@eisbuk/translations";

import CustomerGrid from "@/components/atoms/CustomerGrid";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import {
  getCustomersByBirthday,
  getCustomersList,
} from "@/store/selectors/customers";
import { getAboutOrganization } from "@/store/selectors/app";
import { getDefaultCountryCode } from "@/store/selectors/orgInfo";

import useTitle from "@/hooks/useTitle";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { isEmpty } from "@/utils/helpers";
import { getNewSubscriptionNumber } from "./utils";

import { adminLinks } from "@/data/navigation";
import { DateTime } from "luxon";
import { __organization__ } from "@/lib/constants";
import { createModal } from "@/features/modal/useModal";

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();

  const defaultDialCode = useSelector(getDefaultCountryCode);

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  useTitle(t(NavigationLabel.Athletes));

  const customers = useSelector(getCustomersList(true));
  const { displayName = "" } =
    useSelector(getAboutOrganization)[__organization__] || {};
  useFirestoreSubscribe([OrgSubCollection.Customers]);

  const { openWithProps: openCustomerForm } = useCustomerFormModal();

  const handleAddAthlete = () => {
    // Get next subscription number to start the customer form
    // it can still be updated in the form if needed
    const subscriptionNumber = getNewSubscriptionNumber(customers);

    openCustomerForm({
      customer: { subscriptionNumber },
      defaultDialCode,
    });
  };

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      {/* {!isLoaded(customers) && <LinearProgress />} */}
      <Grid item xs={12}>
        {
          // (isLoaded(customers) &&
          !isEmpty(customers) && (
            <CustomerGrid {...{ customers, displayName }} />
          )
          // )
        }
        <Fab
          data-testid="add-athlete"
          color="primary"
          aria-label={t(ActionButton.AddAthlete)}
          className={[classes.fab, classes.buttonPrimary].join(" ")}
          onClick={handleAddAthlete}
        >
          <AddIcon />
        </Fab>
      </Grid>
    </Layout>
  );
};

const useCustomerFormModal = createModal("CustomerFormDialog");

const useStyles = makeStyles((theme: ETheme) => ({
  headerHero: {
    backgroundColor: theme.palette.secondary.main,
    paddingBottom: theme.spacing(3),
  },
  tableContainer: {
    height: "calc(100vh - 9rem)",
    overflowX: "hidden",
    overflowY: "auto",
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(5),
    right: theme.spacing(5),
  },
  // The following is a workaround to not overrule the Mui base button styles
  // by Tailwind's preflight reset
  buttonPrimary: { backgroundColor: theme.palette.primary.main },
}));

export default CustomersPage;
