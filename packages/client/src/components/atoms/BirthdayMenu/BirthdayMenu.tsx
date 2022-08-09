import React, { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { DateTime } from "luxon";

import { CustomersByBirthday } from "@eisbuk/shared";
import { Cake } from "@eisbuk/svg";

import Menu from "@mui/material/Menu";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Badge from "@mui/material/Badge";

import makeStyles from "@mui/styles/makeStyles";

import {
  useTranslation,
  BirthdayMenu as BirthdayEnums,
} from "@eisbuk/translations";

import BirthdayMenuItem from "./BirthdayMenuItem";

import { __birthdayMenu__ } from "@/__testData__/testIds";
import { openModal } from "@/features/modal/actions";
import { Button } from "@eisbuk/ui";

interface BirthdayMenuProps {
  customers: CustomersByBirthday[];
}

const BirthdayMenu: React.FC<BirthdayMenuProps> = ({ customers }) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [birthdaysAnchorEl, setBirthdaysAnchorEl] =
    useState<HTMLElement | null>(null);
  const handleBirthdaysClick: React.MouseEventHandler<HTMLSpanElement> = (e) =>
    setBirthdaysAnchorEl(e.currentTarget);
  const handleBirthdaysClose = () => () => {
    setBirthdaysAnchorEl(null);
  };
  const handleShowAll = () => {
    // Close the small popup (menu)
    setBirthdaysAnchorEl(null);
    // Open the full birthday - customer list in modal
    dispatch(openModal({ component: "BirthdayDialog", props: { customers } }));
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
        className={[classes.badge, "cursor-normal", "select-none"].join(" ")}
        color="error"
        badgeContent={getTodaysBirthdays}
        data-testid={__birthdayMenu__}
      >
        <Button
          onClick={handleBirthdaysClick}
          className="h-11 w-11 !p-2 ml-2  hover:bg-white/10"
        >
          <Cake />
        </Button>
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
          className={[classes.birthdayHeader, "cursor-pointer"].join(" ")}
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
