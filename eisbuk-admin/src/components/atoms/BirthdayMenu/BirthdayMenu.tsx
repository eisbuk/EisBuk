import React, { useState } from "react";

import { CustomersByBirthday } from "eisbuk-shared";

import Menu from "@material-ui/core/Menu";
import IconButton from "@material-ui/core/IconButton";
import Cake from "@material-ui/icons/Cake";
import Badge from "@material-ui/core/Badge";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { useTranslation } from "react-i18next";
import { MenuButton } from "@/enums/translations";
import BirthdayMenuItem from "./BirthdayMenuItem";
import { DateTime } from "luxon";
interface Props {
  customers: CustomersByBirthday[];
  onClickShowAll: () => void;
}
const BirthdayMenu: React.FC<Props> = ({ customers, onClickShowAll }) => {
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
  const handleShowAll = () => {
    onClickShowAll();
    setBirthdaysAnchorEl(null);
  };

  const getTodaysBirthdays = (): number =>
    customers[0].birthday === DateTime.now().toISODate().substring(5)
      ? customers[0].customers.length
      : 0;

  return (
    <>
      <Badge
        className={classes.badge}
        color="secondary"
        badgeContent={getTodaysBirthdays()}
      >
        <IconButton onClick={handleBirthdaysClick}>
          <Cake />
        </IconButton>
      </Badge>
      <Menu
        anchorEl={birthdaysAnchorEl}
        keepMounted
        open={Boolean(birthdaysAnchorEl)}
        onClose={handleBirthdaysClose()}
        PaperProps={{
          style: {
            maxHeight: "50rem",
            width: "40ch",
          },
        }}
      >
        {customers.slice(0, 3).map((customer) => {
          return (
            <div key={customer.birthday}>
              {customer.customers.slice(0, 2).map((cus) => {
                return (
                  !cus.deleted &&
                  cus.birthday && (
                    <div>
                      <BirthdayMenuItem key={cus.id} customer={cus} />
                    </div>
                  )
                );
              })}
            </div>
          );
        })}
        <div
          onClick={handleShowAll}
          className={`${classes.birthdayHeader} ${classes.pointerCursor}`}
        >
          {t(MenuButton.ShowAll)}
        </div>
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
  pointerCursor: { cursor: "pointer" },

  badge: {
    "& .MuiBadge-anchorOriginTopRightRectangle": {
      transform: "translate(0%, 0%)",
    },
  },
}));

export default BirthdayMenu;
