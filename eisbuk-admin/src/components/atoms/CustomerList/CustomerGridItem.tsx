import React from "react";

import Box from "@material-ui/core/Box";

import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Customer } from "eisbuk-shared";

import EisbukAvatar from "@/components/users/EisbukAvatar";

interface Props extends Customer {
  onClick?: (customer: Customer) => void;
}

const CustomerGridItem: React.FC<Props> = ({
  onClick = () => {},
  ...customer
}) => {
  const classes = useStyles();

  return (
    <div onClick={() => onClick(customer)} className={classes.card}>
      <Card>
        <CardContent className={classes.cardContent}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <EisbukAvatar {...customer} />
          </Box>
          <Typography className={classes.name} variant="body2">
            {customer.name} {customer.surname}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

const useStyles = makeStyles(() => ({
  cursorPointer: { cursor: "pointer" },
  card: {
    padding: "0.7rem",
    cursor: "pointer",
    // flexGrow: 1,
  },
  cardContent: {
    // height: "4rem",
    paddingTop: "2rem",
    height: "10rem",
  },
  name: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "1rem",
  },
}));

export default CustomerGridItem;
