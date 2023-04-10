import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";

import Fab from "@mui/material/Fab";
import Grid from "@mui/material/Grid";

import AddIcon from "@mui/icons-material/Add";

import makeStyles from "@mui/styles/makeStyles";

import { ETheme } from "@/themes";

import { OrgSubCollection, __addAthleteId__ } from "@eisbuk/shared";
import { Layout } from "@eisbuk/ui";
import {
  useTranslation,
  NavigationLabel,
  ActionButton,
} from "@eisbuk/translations";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { PrivateRoutes } from "@/enums/routes";

import CustomerGrid from "@/components/atoms/CustomerGrid";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import {
  getCustomersByBirthday,
  getCustomersList,
} from "@/store/selectors/customers";
import { getAboutOrganization } from "@/store/selectors/app";

import useTitle from "@/hooks/useTitle";

import { isEmpty } from "@/utils/helpers";
import { getOrganization } from "@/lib/getters";

import { adminLinks } from "@/data/navigation";
import { __organization__ } from "@/lib/constants";

const AthletesPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();

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

  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Customers },
  ]);

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <Grid item xs={12}>
        {!isEmpty(customers) && (
          <CustomerGrid {...{ customers, displayName }} />
        )}
        <Link to={PrivateRoutes.NewAthlete}>
          <Fab
            data-testid={__addAthleteId__}
            color="primary"
            aria-label={t(ActionButton.AddAthlete)}
            className={[classes.fab, classes.buttonPrimary].join(" ")}
          >
            <AddIcon />
          </Fab>
        </Link>
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
  // The following is a workaround to not overrule the Mui base button styles
  // by Tailwind's preflight reset
  buttonPrimary: { backgroundColor: theme.palette.primary.main },
}));

export default AthletesPage;
