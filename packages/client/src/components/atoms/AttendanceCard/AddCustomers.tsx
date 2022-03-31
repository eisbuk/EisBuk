import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Dialog, { DialogProps } from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import Close from "@mui/icons-material/Close";

import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "@eisbuk/shared";

import { ActionButton } from "@/enums/translations";

import {
  __addCustomersDialogId__,
  __closeCustomersListId__,
} from "./__testData__/testIds";
import CustomerList from "../CustomerList";

interface Props extends Omit<DialogProps, "onClose"> {
  onClose: () => void;
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
}

const AddCustomersList: React.FC<Props> = ({
  onClose,
  customers,
  onAddCustomer,
  ...dialogProps
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const handleCustomerClick = (customer: Customer) => {
    onAddCustomer(customer);
  };

  const filteredCustomers = customers.filter((customer) => !customer.deleted);

  // control closing of the modal when the list is empty
  useEffect(() => {
    if (!filteredCustomers || !filteredCustomers.length) {
      onClose();
    }
  }, [filteredCustomers]);

  return (
    <Dialog
      data-testid={__addCustomersDialogId__}
      onClose={onClose}
      {...dialogProps}
      maxWidth="md"
    >
      <div className={classes.container}>
        <Typography variant="h6" component="h2" className={classes.title}>
          {t(ActionButton.AddCustomers)}
        </Typography>
        <IconButton
          className={classes.closeButton}
          onClick={() => onClose()}
          data-testid={__closeCustomersListId__}
          size="large"
        >
          <Close />
        </IconButton>
        <CustomerList
          className={classes.listContainer}
          tableContainerClassName={classes.tableContainer}
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
        />
      </div>
    </Dialog>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    height: "100%",
    width: "90vw",
    position: "relative",
    paddingTop: "4rem",
    paddingBottom: "0",
    backgroundColor: theme.palette.primary.light,
    overflow: "hidden",
    [theme.breakpoints.up("sm")]: {
      width: "70vw",
    },
    [theme.breakpoints.up("md")]: {
      width: "35vw",
    },
  },
  title: {
    position: "absolute",
    left: "1.5rem",
    top: "2rem",
    transform: "translateY(-50%)",
  },
  closeButton: {
    position: "absolute",
    top: "2rem",
    right: "2rem",
    transform: "translate(50%, -50%)",
  },
  listContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  tableContainer: {
    overflowY: "auto",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 14rem)",
  },
}));

export default AddCustomersList;
