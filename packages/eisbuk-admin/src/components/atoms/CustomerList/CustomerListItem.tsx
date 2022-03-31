import React from "react";

import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Box from "@mui/material/Box";

import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import EisbukAvatar from "@/components/users/EisbukAvatar";

interface Props extends Customer {
  onClick?: (customer: Customer) => void;
}

const CustomerListItem: React.FC<Props> = ({
  onClick = () => {},
  ...customer
}) => {
  const classes = useStyles();

  const handleClick = () => onClick(customer);

  return (
    <TableRow onClick={handleClick} className={classes.cursorPointer}>
      <TableCell>
        <Box display="flex" flexDirection="row">
          <EisbukAvatar {...customer} />
        </Box>
      </TableCell>
      <TableCell>{customer.name}</TableCell>
      <TableCell>{customer.surname}</TableCell>
    </TableRow>
  );
};

const useStyles = makeStyles(() => ({ cursorPointer: { cursor: "pointer" } }));

export default CustomerListItem;
