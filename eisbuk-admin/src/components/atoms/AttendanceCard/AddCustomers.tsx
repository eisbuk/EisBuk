import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";

import Close from "@material-ui/icons/Close";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import { __addCustomersTitle__ } from "@/lib/labels";

import EisbukAvatar from "@/components/users/EisbukAvatar";

import {
  __closeCustomersListId__,
  __customersListId__,
} from "./__testData__/testIds";

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

  const handleCustomerClick = (customer: Customer) => () => {
    setAddedCustomers([...addedCustomers, customer.id]);
    onAddCustomer(customer);
  };

  return (
    <Dialog onClose={() => onClose()} {...dialogProps}>
      <div className={classes.container}>
        <Typography variant="h6" component="h2" className={classes.title}>
          {t(__addCustomersTitle__)}
        </Typography>
        <IconButton
          className={classes.closeButton}
          onClick={() => onClose()}
          data-testid={__closeCustomersListId__}
        >
          <Close />
        </IconButton>
        <List
          data-testid={__customersListId__}
          className={classes.listContainer}
        >
          {customers.map(
            (customer) =>
              !addedCustomers.includes(customer.id) &&
              !customer.deleted && (
                <ListItem
                  key={customer.id}
                  onClick={handleCustomerClick(customer)}
                  button
                >
                  <ListItemAvatar>
                    <EisbukAvatar {...customer} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${customer.name} ${customer.surname}`}
                  />
                </ListItem>
              )
          )}
        </List>
      </div>
    </Dialog>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    height: "100%",
    width: "35vw",
    position: "relative",
    paddingTop: "4rem",
    paddingBottom: "0",
    backgroundColor: theme.palette.primary.light,
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
    height: "calc(100% - 4rem)",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflow: "auto",
  },
}));

export default AddCustomersList;
