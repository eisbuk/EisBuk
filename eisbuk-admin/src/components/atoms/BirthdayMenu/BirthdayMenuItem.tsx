import React from "react";

import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Box from "@material-ui/core/Box";
import makeStyles from "@material-ui/core/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import { DateTime } from "luxon";
import { DateFormat } from "@/enums/translations";

import { useTranslation } from "react-i18next";

interface Props {
  customer: Customer;
  showAll?: boolean;
}

const BirthdayMenuItem: React.FC<Props> = ({ customer, showAll = false }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const customerBirthday =
    customer.birthday === DateTime.now().toISODate().substring(5)
      ? t("Today")
      : t(DateFormat.DayMonth, {
          date: DateTime.fromISO(customer.birthday || ""),
        });
  return (
    <TableRow>
      <TableCell>
        <Box display="flex" flexDirection="row">
          <EisbukAvatar {...customer} wrap={false} />
        </Box>
      </TableCell>
      <TableCell className={classes.fullWidthCell}>
        {customer.name} {customer.surname}
        {!showAll && <div className={classes.birthday}>{customerBirthday}</div>}
      </TableCell>
    </TableRow>
  );
};

export default BirthdayMenuItem;

// #region styles
const useStyles = makeStyles(() => ({
  birthday: {
    position: "absolute",
    transform: "translateY(-100%)",
    right: "1rem",
    fontWeight: "bold",
  },
  fullWidthCell: {
    width: "100%",
  },
}));
// #endregion styles
