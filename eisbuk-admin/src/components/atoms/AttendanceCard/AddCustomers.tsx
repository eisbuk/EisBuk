import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";

import Close from "@material-ui/icons/Close";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import { ActionButton } from "@/enums/translations";

import { __closeCustomersListId__ } from "./__testData__/testIds";
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

  /**
   * Intermmediate state for customers added, for more responsive UI (before server confirms)
   */

  const [addedCustomers, setAddedCustomers] = useState<Customer["id"][]>([]);

  /**
   * Clear recently added customer each time we close the dialog.
   * We're confident that the filtered customers will get confirmed from the server (passing customers already filtered)
   * and this way we're not keeping garbage.
   */
  useEffect(() => {
    if (dialogProps.open) {
      setAddedCustomers([]);
    }
  }, [dialogProps.open]);

  const handleCustomerClick = (customer: Customer) => {
    setAddedCustomers([...addedCustomers, customer.id]);
    onAddCustomer(customer);
  };

  const filteredCustomers = customers.filter(
    (customer) => !addedCustomers.includes(customer.id) && !customer.deleted
  );

  // control closing of the modal when the list is empty
  useEffect(() => {
    if (!filteredCustomers || !filteredCustomers.length) {
      onClose();
    }
  }, [filteredCustomers]);

  return (
    <Dialog onClose={onClose} {...dialogProps} maxWidth="md">
      <div className={classes.container}>
        <Typography variant="h6" component="h2" className={classes.title}>
          {t(ActionButton.AddCustomers)}
        </Typography>
        <IconButton
          className={classes.closeButton}
          onClick={() => onClose()}
          data-testid={__closeCustomersListId__}
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
