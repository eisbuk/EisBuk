import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Dialog from "@material-ui/core/Dialog";
import IconButton from "@material-ui/core/IconButton";

import makeStyles from "@material-ui/core/styles/makeStyles";

import Close from "@material-ui/icons/Close";

import { Customer } from "eisbuk-shared";

import { CategoryLabel, CustomerLabel } from "@/enums/translations";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import CustomerOperationButtons from "./CustomerOperationButtons";
import ActionButtons from "./ActionButtons";

import { capitalizeFirst } from "@/utils/helpers";

import { __customersDialogId__ } from "@/__testData__/testIds";

interface Props {
  customer: Customer | null;
  onClick?: (customer: Customer) => void;
  onClose: () => void;
}

/**
 * A component used to render customer's info in a dialog.
 * Used to inspect/edit/delete customer and perform additional actions
 * like sending of a booking link via sms/email.
 *
 * @param {function} props.onClose on close callback fired when the modal (Dialog) closes
 * @param {object | null} props.customer customer data to display, or `null` -> if `null` the modal is closed and the component hidden
 */
const CustomerCard: React.FC<Props> = ({ onClose, customer }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  /**
   * A render function used to automate rendering of
   * customer's record values
   * @param customer
   */
  const renderCustomerData = (customer: Customer): JSX.Element => {
    const renderOrder: (keyof Customer)[] = [
      "name",
      "surname",
      "category",
      "email",
      "phone",
      "birthday",
      "certificateExpiration",
      "covidCertificateReleaseDate",
    ];

    return (
      <>
        {renderOrder.map((property) => {
          /** We're using capitalize first to transform customer property into appropriate i18n key */
          const translatedLabel = t(CustomerLabel[capitalizeFirst(property)]);

          const value =
            // if we're rendering category we're applying special formating as
            // translations of multi-word categories are "-" separeted lowercased words
            property === "category"
              ? capitalizeFirst(t(CategoryLabel[customer.category])).replace(
                  "-",
                  " "
                )
              : customer[property] || "-";

          return (
            <Typography variant="h6">
              <span className={classes.bold}>{translatedLabel}: </span>
              {value}
            </Typography>
          );
        })}
      </>
    );
  };

  return (
    <Dialog
      maxWidth="lg"
      data-testid={__customersDialogId__}
      open={Boolean(customer)}
      onClose={onClose}
    >
      <Card className={classes.container}>
        <CardContent>
          <Box className={classes.topSection}>
            <EisbukAvatar {...customer!} className={classes.avatar} />
            <div className={classes.nameContainer}>
              <Typography variant="h4" className={classes.bold}>
                {customer?.name}
              </Typography>
              <Typography variant="h4">{customer?.surname}</Typography>
              <CustomerOperationButtons
                customer={customer!}
                className={classes.customerOperationsContainer}
                {...{ onClose }}
              />
            </div>
          </Box>
          {renderCustomerData(customer!)}
        </CardContent>
        <ActionButtons
          className={classes.actionButtonsContainer}
          customer={customer!}
          onClose={onClose}
        />
        <IconButton onClick={onClose} className={classes.exitButton}>
          <Close />
        </IconButton>
      </Card>
    </Dialog>
  );
};

const useStyles = makeStyles(() => ({
  bold: {
    fontWeight: "bold",
  },
  container: {
    position: "relative",
  },
  exitButton: {
    position: "absolute",
    right: "0.5rem",
    top: "0.5rem",
  },
  topSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    marginBottom: "2rem",
  },
  avatar: {
    width: "5rem",
    height: "5rem",
  },
  nameContainer: {
    marginLeft: "1rem",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  customerOperationsContainer: {
    position: "absolute",
    top: "-1rem",
    right: "-1rem",
    transform: "translateX(100%)",
  },
  actionButtonsContainer: {
    width: "100%",
    padding: "1rem",
    boxSizing: "border-box",
    justifyContent: "center",
  },
}));

export default CustomerCard;
