import React from "react";

import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Box from "@material-ui/core/Box";

import makeStyles from "@material-ui/core/styles/makeStyles";

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
