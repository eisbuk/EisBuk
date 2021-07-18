import React from "react";
import { makeStyles } from "@material-ui/core/styles";

/** @TEMP This component is unused, might just delete */

const Layout: React.FC = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.root}>{{ children }}</div>;
};

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
  },
}));

export default Layout;
