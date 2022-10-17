import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";

import makeStyles from "@mui/styles/makeStyles";

import Close from "@mui/icons-material/Close";

import { Customer, OrganizationData } from "@eisbuk/shared";
import {
  useTranslation,
  CategoryLabel,
  CustomerLabel,
} from "@eisbuk/translations";

import { BaseModalProps } from "@/features/modal/types";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import CustomerOperationButtons from "./CustomerOperationButtons";
import ActionButtons from "./ActionButtons";
import ExtendedDateField from "./ExtendedDateField";

import { capitalizeFirst } from "@/utils/helpers";

interface CustomerCardProps extends BaseModalProps {
  customer: Customer | null;
  displayName: OrganizationData["displayName"];
}

/**
 * A component used to render customer's info in a dialog.
 * Used to inspect/edit/delete customer and perform additional actions
 * like sending of a booking link via sms/email.
 */
const CustomerCard: React.FC<CustomerCardProps> = ({
  onClose,
  customer,
  className = "",
  displayName = "",
}) => {
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
      "categories",
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
            property === "categories"
              ? customer.categories
                  .map(
                    (cat) =>
                      `${capitalizeFirst(t(CategoryLabel[cat])).replace(
                        /-/g,
                        " "
                      )}`
                  )
                  .join(", ")
              : customer[property] || "-";

          return (
            <React.Fragment key={property}>
              <Typography
                className={classes.property}
                variant="h6"
                key={property}
              >
                <span className={classes.bold}>{translatedLabel}: </span>
                <span className={classes.value}>{value}</span>
              </Typography>
              <div className={classes.divider} />
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <Card
      aria-label="customer-dialog"
      className={[...containerClasses, className].join(" ")}
    >
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
        displayName={displayName}
      />
      <IconButton
        aria-label="close-button"
        onClick={onClose}
        className={classes.exitButton}
        size="large"
      >
        <Close />
      </IconButton>
    </Card>
  );
};

const containerClasses = ["max-h-[90vh]", "overflow-auto"];

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
    display: "block",
    [theme.breakpoints.up("sm")]: {
      display: "inline",
    },
  },
}));

export default CustomerCard;
