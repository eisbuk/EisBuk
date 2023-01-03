import React from "react";

import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { Customer } from "@eisbuk/shared";

import EisbukAvatar from "@/components/users/EisbukAvatar";

interface Props extends Customer {
  onClick?: (customer: Customer) => void;
}

const CustomerGridItem: React.FC<Props> = ({
  onClick = () => {},
  ...customer
}) => {
  const classes = useStyles();

  const customerValidated = customer.categories.length > 0;

  return (
    <div
      style={
        customerValidated ? {} : { opacity: 0.5, filter: "grayscale(90%)" }
      }
      onClick={() => onClick(customer)}
      className={classes.container}
    >
      <EisbukAvatar className={classes.avatar} {...customer} />
      <Typography variant="body2">{customer.name}</Typography>
      <Typography variant="body2">{customer.surname}</Typography>
    </div>
  );
};

const useStyles = makeStyles(() => ({
  cursorPointer: { cursor: "pointer" },
  container: {
    boxSizing: "border-box",
    width: "6.125rem",
    height: "7.5rem",
    margin: "1rem 0.75rem",
    padding: "1.125rem 0.25rem",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    cursor: "pointer",
  },
  avatar: { width: 50, height: 50, marginBottom: "0.5rem" },
}));

export default CustomerGridItem;
