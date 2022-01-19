import React, { useState, useMemo } from "react";

import { CustomersByBirthday } from "eisbuk-shared";

import Menu from "@material-ui/core/Menu";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import IconButton from "@material-ui/core/IconButton";
import Cake from "@material-ui/icons/Cake";
import Badge from "@material-ui/core/Badge";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { useTranslation } from "react-i18next";
import { BirthdayMenu as BirthdayEnums } from "@/enums/translations";
import BirthdayMenuItem from "./BirthdayMenuItem";
import { DateTime } from "luxon";
interface Props {
  customers: CustomersByBirthday[];
  onClickShowAll: () => void;
}
const BirthdayMenu: React.FC<Props> = ({ customers, onClickShowAll }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const [
    birthdaysAnchorEl,
    setBirthdaysAnchorEl,
  ] = useState<HTMLElement | null>(null);
  const handleBirthdaysClick: React.MouseEventHandler<HTMLSpanElement> = (e) =>
    setBirthdaysAnchorEl(e.currentTarget);
  const handleBirthdaysClose = () => () => {
    setBirthdaysAnchorEl(null);
  };
  const handleShowAll = () => {
    onClickShowAll();
    setBirthdaysAnchorEl(null);
  };

  const getTodaysBirthdays = useMemo(
    (): number =>
      customers.length > 0 &&
      customers[0].birthday === DateTime.now().toISODate().substring(5)
        ? customers[0].customers.length
        : 0,
    [customers]
  );

  return (
    <>
      <Badge
        className={classes.badge}
        color="error"
        badgeContent={getTodaysBirthdays}
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
            <Table key={customer.birthday}>
              <TableBody>
                {customer.customers.slice(0, 2).map((cus) => {
                  return (
                    !cus.deleted &&
                    cus.birthday && (
                      <BirthdayMenuItem key={cus.id} customer={cus} />
                    )
                  );
                })}
              </TableBody>
            </Table>
          );
        })}
        <div
          onClick={handleShowAll}
          className={`${classes.birthdayHeader} ${classes.pointerCursor}`}
        >
          {t(BirthdayEnums.ShowAll)}
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
    "& .MuiBadge-anchorOriginTopRightRectangle.MuiBadge-invisible": {
      display: "none",
    },
  },
}));

export default BirthdayMenu;
