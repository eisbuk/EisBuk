import React, { useState } from "react";

import { CustomersByBirthday, fromISO } from "eisbuk-shared";

import Menu from "@material-ui/core/Menu";

import IconButton from "@material-ui/core/IconButton";

import Cake from "@material-ui/icons/Cake";
import CustomerListItem from "../CustomerList/CustomerListItem";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { DateTime } from "luxon";

import { useTranslation } from "react-i18next";
import { DateFormat } from "@/enums/translations";
interface Props {
  customers: CustomersByBirthday[];
}
const BirthdayMenu: React.FC<Props> = ({ customers }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const [birthdaysAnchorEl, setBirthdaysAnchorEl] =
    useState<HTMLElement | null>(null);
  const handleBirthdaysClick: React.MouseEventHandler<HTMLSpanElement> = (
    e
  ) => {
    setBirthdaysAnchorEl(e.currentTarget);
  };

  const handleBirthdaysClose = () => () => {
    setBirthdaysAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleBirthdaysClick}>
        <Cake />
      </IconButton>
      <Menu
        anchorEl={birthdaysAnchorEl}
        keepMounted
        open={Boolean(birthdaysAnchorEl)}
        onClose={handleBirthdaysClose()}
        PaperProps={{
          style: {
            maxHeight: "20rem",
            width: "35ch",
          },
        }}
      >
        {customers.map((customer) => {
          const customerBirthday =
            customer.birthday.substring(5) ===
            DateTime.now().toISODate().substring(5)
              ? t("Today")
              : t(DateFormat.DayMonth, { date: fromISO(customer.birthday) });

          return (
            <div key={customer.birthday}>
              <div className={classes.birthdayHeader}>{customerBirthday}</div>
              {customer.customers?.map((cus) => {
                return (
                  !cus.deleted &&
                  cus.birthday && (
                    <CustomerListItem key={cus.id} {...{ ...cus }} />
                  )
                );
              })}
            </div>
          );
        })}
      </Menu>
    </>
  );
};
const useStyles = makeStyles(() => ({
  birthdayHeader: {
    display: "flex",
    alignItems: "center",
    fontSize: "20px",
    margin: "10px",
  },
  defaultPointer: { cursor: "default" },
}));

export default BirthdayMenu;
