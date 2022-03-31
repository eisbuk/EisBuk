import React from "react";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { currentTheme, organizationInfo } from "@/themes";

interface Props {
  headingText: string;
}

const AppbarCustomer: React.FC<Props> = ({ headingText }) => {
  const classes = useStyles();
  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          align="center"
          noWrap
          className={classes.title}
        >
          {headingText ? headingText : organizationInfo.name}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  title: {
    flexGrow: 1,
  },
}));

export default AppbarCustomer;