import React, { useEffect, useState } from "react";

import TextField from "@mui/material/TextField";

import makeStyles from "@mui/styles/makeStyles";

import { Customer, OrganizationData } from "@eisbuk/shared";

import CustomerGridItem from "./CustomerGridItem";

import { createModal } from "@/features/modal/useModal";

import { __customersGridId__ } from "@/__testData__/testIds";

interface CustomerGridProps {
  customers?: Customer[];
  className?: string;
  displayName: OrganizationData["displayName"];
  tableContainerClassName?: string;
}

const CustomerGrid: React.FC<CustomerGridProps> = ({
  customers,
  className = "",
  displayName = "",
}) => {
  const classes = useStyles();

  // search flow
  const [searchString, setSearchString] = useState("");
  const searchRegex = new RegExp(searchString, "i");

  const { openCustomerCard } = useCustomerCard(customers, displayName);

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
                onClick={({ id }) => openCustomerCard(id)}
                {...customer}
              />
            )
        )}
      </div>
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

// #region CustomerCard
const useCustomerModal = createModal("CustomerCard");

/**
 * A hook used to open CustomerCard modal on customer click. When the 'openCustomerCard'
 * is fired, the customer is open in modal, and all further updates to the given customer
 * structure are derived from updated `customers` param (passed to hook initialisation) and propagated
 * to modal update.
 * @param customers
 * @param displayName
 * @returns
 */
const useCustomerCard = (
  customers: Customer[] | undefined,
  displayName: string
) => {
  const [modalProps, setModalProps] = useState<any>();

  useEffect(() => {
    if (!modalProps) {
      return;
    }
    const oldCustomer = modalProps.customer;
    const customer = customers?.find(
      ({ id }) => oldCustomer && id === oldCustomer.id
    );

    if (!customer) {
      setModalProps(undefined);
      return;
    }

    setModalProps({ customer, displayName });
  }, [customers]);

  const { openWithProps } = useCustomerModal(modalProps);

  const openCustomerCard = (customerId: string) => {
    const customer = customers?.find(({ id }) => id === customerId);
    if (customer) {
      openWithProps({ customer, displayName });
      setModalProps({ customer, displayName });
    }
  };

  return {
    openCustomerCard,
  };
};
// #region CustomerCard

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
