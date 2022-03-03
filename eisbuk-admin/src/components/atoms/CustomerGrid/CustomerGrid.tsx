import React, { useState } from "react";

import TextField from "@mui/material/TextField";

import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import CustomerGridItem from "./CustomerGridItem";
import CustomerDialog from "../CustomerCard";

import { __customersGridId__ } from "@/__testData__/testIds";
interface Props {
  customers?: Customer[];
  className?: string;
  tableContainerClassName?: string;
}

const CustomerGrid: React.FC<Props> = ({ customers, className = "" }) => {
  const classes = useStyles();

  // search flow
  const [searchString, setSearchString] = useState("");
  const searchRegex = new RegExp(searchString, "i");

  const [dialogCustomer, setDialogCustomer] = useState<Customer | null>(null);

  const handleClose = () => {
    setDialogCustomer(null);
  };
  const onCustomerClick = (customer: Customer) => {
    setDialogCustomer(customer);
  };

  return (
    <div className={className}>
      <SearchField {...{ searchString, setSearchString }} />

      <div className={classes.container} data-testid={__customersGridId__}>
        {customers?.map(
          (customer, i) =>
            (searchRegex.test(customer.name) ||
              searchRegex.test(customer.surname)) &&
            !customer.deleted && (
              <CustomerGridItem
                key={customer.id || `temp-key-${i}`}
                onClick={onCustomerClick}
                {...customer}
              />
            )
        )}
      </div>
      {dialogCustomer && (
        <CustomerDialog onClose={handleClose} customer={dialogCustomer} />
      )}
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
  tableHeadRow: {
    height: "3rem",
  },
  tableContainer: {
    overflow: "auto",
  },
  container: {
    display: "flex",
    flexFlow: "row wrap",
    justifyContent: "start",
  },
}));
// #endregion styles

export default CustomerGrid;
