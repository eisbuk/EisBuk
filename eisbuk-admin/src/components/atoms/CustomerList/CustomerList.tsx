import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableRow from "@material-ui/core/TableRow";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TextField from "@material-ui/core/TextField";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import { CustomerLabel } from "@/enums/translations";

import CustomerListItem from "./CustomerListItem";

import { __customersListId__ } from "@/__testData__/testIds";

interface Props {
  customers?: Customer[];
  extended?: boolean;
  onCustomerClick?: (customer: Customer) => void;
  classNames?: { rootDiv?: string; tableContainer?: string };
}

const CustomerList: React.FC<Props> = ({
  customers,
  extended,
  onCustomerClick = () => {},
  classNames = { rootDiv: "" },
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  /** Additional cells render on extended version */
  const extendedCells = (
    <>
      <TableCell>{t(CustomerLabel.Category)}</TableCell>
      <TableCell>{t(CustomerLabel.Email)}</TableCell>
    </>
  );

  // search flow
  const [searchString, setSearchString] = useState("");
  const searchRegex = new RegExp(searchString, "i");

  return (
    <div className={classNames?.rootDiv}>
      <SearchField {...{ searchString, setSearchString }} center={!extended} />
      <TableContainer
        className={classNames.tableContainer || classes.tableContainer}
      >
        <Table size="small">
          <TableHead>
            <TableRow className={classes.tableHeadRow}>
              <TableCell></TableCell>
              <TableCell>{t(CustomerLabel.Name)}</TableCell>
              <TableCell>{t(CustomerLabel.Surname)}</TableCell>
              {extended && extendedCells}
            </TableRow>
          </TableHead>
          <TableBody data-testid={__customersListId__}>
            {customers?.map(
              (customer) =>
                (searchRegex.test(customer.name) ||
                  searchRegex.test(customer.surname)) &&
                !customer.deleted && (
                  <CustomerListItem
                    key={customer.id}
                    onClick={onCustomerClick}
                    {...{ ...customer, extended }}
                  />
                )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

// #region SearchField
const SearchField: React.FC<{
  searchString: string;
  setSearchString: React.Dispatch<string>;
  center?: boolean;
}> = ({ searchString, setSearchString, center }) => {
  const classes = useStyles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  return (
    <TextField
      className={center ? classes.searchCenter : classes.searchLeft}
      label="Search"
      value={searchString}
      type="search"
      variant={center ? "outlined" : "standard"}
      onChange={handleChange}
    />
  );
};
// #endregion SearchField

// #region styles
const useStyles = makeStyles(() => ({
  tableHeadRow: {
    height: "3rem",
  },
  searchLeft: {
    margin: "1rem 2rem",
  },
  searchCenter: {
    width: "90%",
    margin: "1rem 5%",
    "& .MuiOutlinedInput-root": {
      boxShadow: "0.125rem 0.125rem 0.25rem rgba(0, 0, 0, 0.2)",
    },
  },
  tableContainer: {
    overflow: "auto",
  },
}));
// #endregion styles

export default CustomerList;
