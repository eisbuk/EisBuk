import React from "react";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "@eisbuk/shared";
import {
  useTranslation,
  ActionButton,
  CustomerLabel,
} from "@eisbuk/translations";

import { createModal } from "@/features/modal/useModal";

interface Props {
  customer: Customer;
  onClose: () => void;
}

const ExtendedDateField: React.FC<Props> = ({ customer }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const { openWithProps: openExtendDateDialog } = useExtendDateModal();

  const displayValue = customer.extendedDate || "-";

  return (
    <>
      <Typography className={classes.field} variant="h6">
        <span>
          <span className={classes.bold}>
            {t(CustomerLabel.ExtendedBookingDate)}:{" "}
          </span>
          {displayValue}
        </span>
        <Button
          className={classes.buttonPrimary}
          color="primary"
          onClick={() => openExtendDateDialog(customer)}
          variant="contained"
        >
          {t(ActionButton.ExtendBookingDate)}
        </Button>
      </Typography>
    </>
  );
};

const useExtendDateModal = createModal("ExtendBookingDateDialog");

const useStyles = makeStyles((theme) => ({
  field: { display: "flex", justifyContent: "space-between", flexWrap: "wrap" },
  bold: {
    fontWeight: "bold",
  },
  buttonPrimary: {
    // The following is a workaround to not overrule the Mui base button styles
    // by Tailwind's preflight reset
    backgroundColor: theme.palette.primary.main,
  },
}));

export default ExtendedDateField;
