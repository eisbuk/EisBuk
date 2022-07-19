import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import Fab from "@mui/material/Fab";
import Grid from "@mui/material/Grid";
// import LinearProgress from "@mui/material/LinearProgress";

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

import CustomerForm from "@/components/customers/CustomerForm";
import CustomerGrid from "@/components/atoms/CustomerGrid";

import { updateCustomer } from "@/store/actions/customerOperations";

import { getCustomersList } from "@/store/selectors/customers";

import useTitle from "@/hooks/useTitle";
import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { isEmpty } from "@/utils/helpers";
import { getNewSubscriptionNumber } from "./utils";

import { adminLinks } from "@/data/navigation";

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const dispatch = useDispatch();

  useTitle(t(NavigationLabel.Athletes));

  const customers = useSelector(getCustomersList(true));
  const subscriptionNumber = getNewSubscriptionNumber(customers);

  const [addAthleteDialog, setAddAthleteDialog] = useState(false);

  useFirestoreSubscribe([OrgSubCollection.Customers]);

  const toggleAddAthleteDialog = () =>
    setAddAthleteDialog(addAthleteDialog ? false : true);

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <Layout isAdmin adminLinks={adminLinks}>
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
          onClick={toggleAddAthleteDialog}
        >
          <AddIcon />
        </Fab>
        <CustomerForm
          open={addAthleteDialog}
          onClose={toggleAddAthleteDialog}
          customer={{ subscriptionNumber }}
          updateCustomer={(customer) => dispatch(updateCustomer(customer))}
        />
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
