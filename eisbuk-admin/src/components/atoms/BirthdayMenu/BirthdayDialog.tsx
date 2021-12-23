import React from "react";
import { useTranslation } from "react-i18next";

import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";

import Close from "@material-ui/icons/Close";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { CustomersByBirthday } from "eisbuk-shared";

import { DateFormat, Title } from "@/enums/translations";
import BirthdayMenuItem from "./BirthdayMenuItem";
import { DateTime } from "luxon";

interface Props extends Omit<DialogProps, "onClose"> {
  onClose: () => void;
  customers: CustomersByBirthday[];
}

const BirthdayDialog: React.FC<Props> = ({
  onClose,
  customers,
  ...dialogProps
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Dialog onClose={onClose} {...dialogProps} maxWidth="md">
      <div className={classes.container}>
        <Typography variant="h6" component="h2" className={classes.title}>
          {t(Title.UpcomingBirthdays)}
        </Typography>
        <IconButton className={classes.closeButton} onClick={() => onClose()}>
          <Close />
        </IconButton>

        <div className={classes.tableContainer}>
          {customers.map((customer) => {
            const customerBirthday =
              customer.birthday === DateTime.now().toISODate().substring(5)
                ? t("Today")
                : t(DateFormat.DayMonth, {
                    date: DateTime.fromISO(`2021-${customer.birthday}`),
                  });
            //   console.log(DateTime.fromISO(customer.birthday));

            return (
              <div key={customer.birthday}>
                <div className={classes.birthdayHeader}>{customerBirthday}</div>

                {customer.customers.map((cus) => {
                  return (
                    !cus.deleted &&
                    cus.birthday && (
                      <BirthdayMenuItem key={cus.id} {...{ ...cus }} />
                    )
                  );
                })}
              </div>
            );
          })}
        </div>
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
    overflow: "hidden",
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

  tableContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflowY: "auto",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 14rem)",
  },
  birthdayHeader: {
    display: "flex",
    alignItems: "center",
    fontSize: "20px",
    margin: "10px",
  },
}));

export default BirthdayDialog;
