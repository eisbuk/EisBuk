import React from "react";
import { useSelector, useDispatch } from "react-redux";

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

import useTitle from "@/hooks/useTitle";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { openModal } from "@/features/modal/actions";

import { isEmpty } from "@/utils/helpers";
import { getNewSubscriptionNumber } from "./utils";

import { adminLinks } from "@/data/navigation";
import { DateTime } from "luxon";

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const dispatch = useDispatch();

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  useTitle(t(NavigationLabel.Athletes));

  const customers = useSelector(getCustomersList(true));

  useFirestoreSubscribe([OrgSubCollection.Customers]);

  const handleAddAthlete = () => {
    // Get next subscription number to start the customer form
    // it can still be updated in the form if needed
    const subscriptionNumber = getNewSubscriptionNumber(customers);

    dispatch(
      openModal({
        component: "CustomerFormDialog",
        props: { customer: { subscriptionNumber } },
      })
    );
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
          !isEmpty(customers) && <CustomerGrid {...{ customers }} />
          // )
        }
        <Fab
          data-testid="add-athlete"
          color="primary"
          aria-label={t(ActionButton.AddAthlete)}
          className={classes.fab}
          onClick={handleAddAthlete}
        >
          <AddIcon />
        </Fab>
      </Grid>
    </Layout>
  );
};

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
}));

export default CustomersPage;
