import React from "react";

import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Box from "@material-ui/core/Box";

import { Customer } from "eisbuk-shared";

import EisbukAvatar from "@/components/users/EisbukAvatar";

type Props = Customer

const BirthdayMenuItem: React.FC<Props> = ({ ...customer }) => {
  return (
    <TableRow>
      <TableCell>
        <Box display="flex" flexDirection="row">
          <EisbukAvatar {...customer} wrap={false} />
        </Box>
      </TableCell>
      <TableCell>
        {customer.name} {customer.surname}
      </TableCell>
    </TableRow>
  );
};

export default BirthdayMenuItem;
