import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import Fab from "@material-ui/core/Fab";
import Grid from "@material-ui/core/Grid";
// import LinearProgress from "@material-ui/core/LinearProgress";

import AddIcon from "@material-ui/icons/Add";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { ETheme } from "@/themes";

import { OrgSubCollection } from "eisbuk-shared";

import { ActionButton, NavigationLabel } from "@/enums/translations";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import CustomerList from "@/components/atoms/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";

import { updateCustomer } from "@/store/actions/customerOperations";

import { getCustomersList } from "@/store/selectors/customers";

import useTitle from "@/hooks/useTitle";

import { isEmpty } from "@/utils/helpers";
import useFirestoreSubscribe from "@/store/firestore/useFirestoreSubscribe";

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const dispatch = useDispatch();

  useTitle(t(NavigationLabel.Athletes));

  const customers = useSelector(getCustomersList(true));

  const [addAthleteDialog, setAddAthleteDialog] = useState(false);

  useFirestoreSubscribe([OrgSubCollection.Customers]);

  const toggleAddAthleteDialog = () =>
    setAddAthleteDialog(addAthleteDialog ? false : true);

  /** @TODO update below when we create `isEmpty` and `isLoaded` helpers */
  return (
    <>
      <AppbarAdmin />
      {/* {!isLoaded(customers) && <LinearProgress />} */}
      <Grid item xs={12}>
        {
          // (isLoaded(customers) &&
          !isEmpty(customers) && (
            <CustomerList
              {...{ customers }}
              tableContainerClassName={classes.tableContainer}
              extended
            />
          )
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
          updateCustomer={(customer) => dispatch(updateCustomer(customer))}
        />
      </Grid>
    </>
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
