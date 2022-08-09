import React from "react";

import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import Close from "@mui/icons-material/Close";

import makeStyles from "@mui/styles/makeStyles";

import { CustomersByBirthday } from "@eisbuk/shared";
import { useTranslation, DateFormat, BirthdayMenu } from "@eisbuk/translations";

import BirthdayMenuItem from "./BirthdayMenuItem";
import { DateTime } from "luxon";

interface Props {
  onClose?: () => void;
  customers: CustomersByBirthday[];
}

const BirthdayDialog: React.FC<Props> = ({ onClose = () => {}, customers }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.container}>
      <Typography variant="h6" component="h2" className={classes.title}>
        {t(BirthdayMenu.UpcomingBirthdays)}
      </Typography>
      <IconButton
        className={classes.closeButton}
        onClick={onClose}
        size="large"
      >
        <Close />
      </IconButton>

      <div className={classes.tableContainer}>
        {customers.map((customer) => {
          const customerBirthday =
            customer.birthday === DateTime.now().toISODate().substring(5)
              ? t(DateFormat.Today)
              : t(DateFormat.DayMonth, {
                  date: DateTime.fromISO(`2021-${customer.birthday}`),
                });

          return (
            <div key={customer.birthday}>
              <div className={classes.birthdayHeader}>{customerBirthday}</div>

              {customer.customers.map((cus) => {
                return (
                  !cus.deleted &&
                  cus.birthday && (
                    <BirthdayMenuItem
                      key={cus.id}
                      customer={cus}
                      showAll={true}
                    />
                  )
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    borderRadius: 6,
    maxWidth: 400,
    height: "100%",
    width: "100vw",
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
