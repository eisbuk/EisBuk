import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";
import { useTranslation } from "react-i18next";

import Container from "@material-ui/core/Container";
import Fab from "@material-ui/core/Fab";
import Grid from "@material-ui/core/Grid";
import LinearProgress from "@material-ui/core/LinearProgress";

import AddIcon from "@material-ui/icons/Add";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { ETheme } from "@/themes";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";

import {
  deleteCustomer,
  updateCustomer,
} from "@/store/actions/customerOperations";

import { getCustomersList } from "@/store/selectors/firestore";

import useTitle from "@/hooks/useTitle";

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [addAthleteDialog, setAddAthleteDialog] = useState(false);
  const dispatch = useDispatch();
  useTitle(t("CustomersPage.Athletes"));

  const toggleAddAthleteDialog = () =>
    setAddAthleteDialog(addAthleteDialog ? false : true);
  const customers = useSelector(getCustomersList);

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
