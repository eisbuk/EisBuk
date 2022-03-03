import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import { ActionButton, CustomerLabel, Prompt } from "@/enums/translations";

import ConfirmDialog from "@/components/global/ConfirmDialog";
import { DateInput } from "@/components/atoms/DateInput";

import { extendBookingDate } from "@/store/actions/customerOperations";

interface Props {
  customer: Customer;
  onClose: () => void;
}

const ExtendedDateField: React.FC<Props> = ({ customer, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const classes = useStyles();

  const displayValue = customer.extendedDate || "-";

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [extendedDateInput, setExtendedDateInput] = useState(
    customer.extendedDate || ""
  );

  const handleExtendBooking = () => {
    dispatch(extendBookingDate(customer.id, extendedDateInput));
    onClose();
  };

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
          color="primary"
          onClick={() => setOpenConfirmDialog(true)}
          variant="contained"
        >
          {t(ActionButton.ExtendBookingDate)}
        </Button>

        <ConfirmDialog
          onConfirm={handleExtendBooking}
          open={openConfirmDialog}
          setOpen={(open) => (open ? null : setOpenConfirmDialog(false))}
          title={t(Prompt.ExtendBookingDateTitle, {
            customer: `${customer.name} ${customer.surname}`,
          })}
        >
          {t(Prompt.ExtendBookingDateBody, {
            customer: `${customer.name} ${customer.surname}`,
          })}
          <DateInput
            value={extendedDateInput}
            onChange={(value) => setExtendedDateInput(value)}
          />
        </ConfirmDialog>
      </Typography>
    </>
  );
};

const useStyles = makeStyles(() => ({
  field: { display: "flex", justifyContent: "space-between", flexWrap: "wrap" },
  bold: {
    fontWeight: "bold",
  },
}));

export default ExtendedDateField;
