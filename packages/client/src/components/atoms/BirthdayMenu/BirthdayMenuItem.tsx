import React from "react";
import { DateTime } from "luxon";

import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Box from "@mui/material/Box";
import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "@eisbuk/shared";
import { DateFormat, useTranslation } from "@eisbuk/translations";

import EisbukAvatar from "@/components/users/EisbukAvatar";

interface Props {
  customer: Customer;
  showAll?: boolean;
}

const BirthdayMenuItem: React.FC<Props> = ({ customer, showAll = false }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const customerBirthday =
    customer.birthday?.substring(5) === DateTime.now().toISODate().substring(5)
      ? t(DateFormat.Today)
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
