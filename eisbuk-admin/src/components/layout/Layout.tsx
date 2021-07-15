import React from "react";
// import AppbarDrawer from "./AppbarDrawer";
import { makeStyles } from "@material-ui/core/styles";
// import DashboardPage from "../pages/Dashboard";

/** @TEMP This component is unused, might just delete */

const Layout: React.FC = ({ children }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      {/* <AppbarDrawer />
      <DashboardPage /> */}
      {{ children }}
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
}));

export default Layout;
