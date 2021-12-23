import React, { useState } from "react";

import { CustomersByBirthday } from "eisbuk-shared";

import Menu from "@material-ui/core/Menu";

import IconButton from "@material-ui/core/IconButton";

import Cake from "@material-ui/icons/Cake";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { DateTime } from "luxon";

import { useTranslation } from "react-i18next";
import { DateFormat, MenuButton } from "@/enums/translations";
import BirthdayMenuItem from "./BirthdayMenuItem";
interface Props {
  customers: CustomersByBirthday[];
  onClickShowAll: () => void;
}
const BirthdayMenu: React.FC<Props> = ({ customers, onClickShowAll }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  // const [showAll, setShowAll] = useState(false);
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
            maxHeight: "50rem",
            width: "35ch",
          },
        }}
      >
        {customers.slice(0, 3).map((customer) => {
          const customerBirthday =
            customer.birthday === DateTime.now().toISODate().substring(5)
              ? t("Today")
              : t(DateFormat.DayMonth, {
                  date: DateTime.fromISO(`2021-${customer.birthday}`),
                });
          return (
            <div key={customer.birthday}>
              {customer.customers.slice(0, 2).map((cus) => {
                return (
                  !cus.deleted &&
                  cus.birthday && (
                    <div>
                      <BirthdayMenuItem key={cus.id} {...{ ...cus }} />
                      <div className={classes.birthday}>{customerBirthday}</div>
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

  birthday: {
    position: "absolute",
    transform: "translateY(-250%)",
    right: "1rem",
  },
}));

export default BirthdayMenu;
