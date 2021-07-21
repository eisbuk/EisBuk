import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";
import { Add as AddIcon } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { Container, Fab, Grid, LinearProgress } from "@material-ui/core";
import { useTranslation } from "react-i18next";

import { LocalStore } from "@/types/store";
import { ETheme } from "@/themes";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";

import { deleteCustomer, updateCustomer } from "@/store/actions/actions";

import { useTitle } from "@/utils/helpers";

/** @TODO use imported selector */
const selectCustomers = (state: LocalStore) =>
  state.firestore.ordered.customers;

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [addAthleteDialog, setAddAthleteDialog] = useState(false);
  const dispatch = useDispatch();
  useTitle(t("CustomersPage.Athlete"));

  const toggleAddAthleteDialog = () =>
    setAddAthleteDialog(addAthleteDialog ? false : true);
  const customers = useSelector(selectCustomers);

  return (
    <>
      <AppbarAdmin />
      {!isLoaded(customers) && <LinearProgress />}
      <Container maxWidth="lg" className={classes.customersContainer}>
        <Grid item xs={12}>
          {
            (isLoaded(customers),
            !isEmpty(customers) && (
              <CustomerList
                onDeleteCustomer={(customer) =>
                  dispatch(deleteCustomer(customer))
                }
                updateCustomer={(customer) =>
                  dispatch(updateCustomer(customer))
                }
                customers={customers.map((o) => ({
                  ...o,
                  tableData: {},
                }))}
              />
            ))
          }
          <Fab
            color="primary"
            aria-label={t("CustomersPage.AddAthlete")}
            className={classes.fab}
            onClick={toggleAddAthleteDialog}
          >
            <AddIcon />
          </Fab>
          <CustomerForm
            open={addAthleteDialog}
            handleClose={toggleAddAthleteDialog}
            updateCustomer={(customer) => dispatch(updateCustomer(customer))}
          />
        </Grid>
      </Container>
    </>
  );
};

const useStyles = makeStyles((theme: ETheme) => ({
  headerHero: {
    backgroundColor: theme.palette.secondary.main,
    paddingBottom: theme.spacing(3),
  },
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
  },
  customersContainer: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(5),
    right: theme.spacing(5),
  },
}));

export default CustomersPage;
