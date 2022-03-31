import React, { useState, useMemo, useEffect } from "react";

import { CustomersByBirthday } from "@eisbuk/shared";

import Menu from "@mui/material/Menu";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import IconButton from "@mui/material/IconButton";
import Cake from "@mui/icons-material/Cake";
import Badge from "@mui/material/Badge";

import makeStyles from "@mui/styles/makeStyles";

import { useTranslation } from "react-i18next";
import { BirthdayMenu as BirthdayEnums } from "@/enums/translations";
import BirthdayMenuItem from "./BirthdayMenuItem";
import { DateTime } from "luxon";
import { __birthdayMenu__ } from "@/__testData__/testIds";
interface Props {
  customers: CustomersByBirthday[];
  onClickShowAll: () => void;
}
const BirthdayMenu: React.FC<Props> = ({ customers, onClickShowAll }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const [birthdaysAnchorEl, setBirthdaysAnchorEl] =
    useState<HTMLElement | null>(null);
  const handleBirthdaysClick: React.MouseEventHandler<HTMLSpanElement> = (e) =>
    setBirthdaysAnchorEl(e.currentTarget);
  const handleBirthdaysClose = () => () => {
    setBirthdaysAnchorEl(null);
  };
  const handleShowAll = () => {
    onClickShowAll();
    setBirthdaysAnchorEl(null);
  };

  const calculateTimeDiff = (now: DateTime) =>
    now.plus({ day: 1 }).startOf("day").toMillis() - now.toMillis();
  const [timeDiff, setTimeDiff] = useState(calculateTimeDiff(DateTime.now()));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeDiff(calculateTimeDiff(DateTime.now()));
    }, timeDiff);
    return () => clearTimeout(timeout);
  }, [timeDiff]);
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
        data-testid={__birthdayMenu__}
      >
        <IconButton onClick={handleBirthdaysClick} size="large">
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
    "& .MuiBadge-anchorOriginTopRightRectangular": {
      transform: "translate(0%, 0%)",
    },
    "& .MuiBadge-anchorOriginTopRightRectangular.MuiBadge-invisible": {
      display: "none",
    },
  },
}));

export default BirthdayMenu;
