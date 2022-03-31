import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";

import makeStyles from "@mui/styles/makeStyles";

import Close from "@mui/icons-material/Close";

import { Customer } from "@eisbuk/shared";

import { CategoryLabel, CustomerLabel } from "@/enums/translations";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import CustomerOperationButtons from "./CustomerOperationButtons";
import ActionButtons from "./ActionButtons";
import ExtendedDateField from "./ExtendedDateField";

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
            <>
              <Typography
                className={classes.property}
                variant="h6"
                key={property}
              >
                <span className={classes.bold}>{translatedLabel}: </span>
                <span className={classes.value}>{value}</span>
              </Typography>
              <div className={classes.divider} />
            </>
          );
        })}
      </>
    );
  };

  return (
    <Dialog
      className={classes.dialog}
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
            </div>
          </Box>
          <CustomerOperationButtons
            customer={customer!}
            className={classes.customerOperationsContainer}
            {...{ onClose }}
          />
          {renderCustomerData(customer!)}
          <ExtendedDateField customer={customer!} {...{ onClose }} />
          <div className={classes.divider} />
        </CardContent>
        <ActionButtons
          className={classes.actionButtonsContainer}
          customer={customer!}
          onClose={onClose}
        />
        <IconButton
          onClick={onClose}
          className={classes.exitButton}
          size="large"
        >
          <Close />
        </IconButton>
      </Card>
    </Dialog>
  );
};

const useStyles = makeStyles((theme) => ({
  dialog: {
    ["& .MuiCard-root"]: {
      overflow: "auto",
    },
    [theme.breakpoints.down("md")]: {
      ["& .MuiDialog-paper"]: {
        margin: "1rem",
      },
    },
  },
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
    width: "100%",
    display: "flex",
    justifyContent: "flex-end",
  },
  actionButtonsContainer: {
    width: "100%",
    padding: "1rem",
    boxSizing: "border-box",
  },
  property: {
    width: "100%",
    display: "block",
    [theme.breakpoints.up("sm")]: {
      display: "inline",
    },
  },
  divider: {
    margin: "1rem 6.125%",
    width: "82.5%",
    height: "1px",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  value: {
    whiteSpace: "nowrap",
    display: "block",
    [theme.breakpoints.up("sm")]: {
      display: "inline",
    },
  },
}));

export default CustomerCard;
