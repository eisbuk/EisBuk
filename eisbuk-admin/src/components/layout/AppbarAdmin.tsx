import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppBar, { AppBarProps } from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Hidden from "@material-ui/core/Hidden";
import List from "@material-ui/core/List";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

import PeopleIcon from "@material-ui/icons/People";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";
import DateRangeIcon from "@material-ui/icons/DateRange";
import MenuIcon from "@material-ui/icons/Menu";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { currentTheme, organizationInfo } from "@/themes";

import { PrivateRoutes } from "@/enums/routes";

import DebugMenu from "@/components/layout/DebugMenu";

import { signOut } from "@/store/actions/authOperations";

import { getFirebaseAuth } from "@/store/selectors/auth";

const AppbarAdmin: React.FC<AppBarProps> = (props) => {
  const classes = useStyles();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const dispatch = useDispatch();

  const auth = useSelector(getFirebaseAuth);

  const handleClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (action = "") => () => {
    switch (action) {
      case "logout":
        dispatch(signOut());
      // eslint-disable-next-line no-fallthrough
      default:
        setAnchorEl(null);
    }
  };

  const currentUser = auth.email || auth.phoneNumber;
  const { t } = useTranslation();

  return (
    <>
      <AppBar {...props} position="static">
        <Toolbar>
          <Typography
            variant="h6"
            onClick={handleClick}
            className={classes.title}
          >
            {organizationInfo.name}
          </Typography>
          <Menu
            id="admin-actions"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose()}
          >
            <MenuItem onClick={handleClose()}>{currentUser}</MenuItem>
            <MenuItem onClick={handleClose("logout")}>Logout</MenuItem>
          </Menu>
          <Hidden xsDown>
            <ButtonGroup color="secondary">
              <Button
                component={Link}
                to={PrivateRoutes.Root}
                variant="contained"
                disabled={location.pathname === PrivateRoutes.Root}
                startIcon={<DateRangeIcon />}
              >
                {t("AppbarAdmin.Attendance")}
              </Button>
              <Button
                component={Link}
                disabled={location.pathname === PrivateRoutes.Prenotazioni}
                to={PrivateRoutes.Prenotazioni}
                variant="contained"
                startIcon={<LibraryBooksIcon />}
              >
                Slots
              </Button>
              <Button
                component={Link}
                to={PrivateRoutes.Atleti}
                disabled={location.pathname === PrivateRoutes.Atleti}
                variant="contained"
                startIcon={<PeopleIcon />}
              >
                {t("AppbarAdmin.Athletes")}
              </Button>
              {organizationInfo.name === "DEV" && <DebugMenu />}
            </ButtonGroup>
          </Hidden>
          <Hidden smUp>
            <Button onClick={() => setDrawerOpen(drawerOpen ? false : true)}>
              <MenuIcon />
            </Button>
          </Hidden>
        </Toolbar>
      </AppBar>
      <Hidden smUp>
        <SwipeableDrawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => setDrawerOpen(true)}
        >
          <List className={classes.drawer}>
            <ListItem
              button
              component={Link}
              to={PrivateRoutes.Root}
              disabled={location.pathname === PrivateRoutes.Root}
            >
              <ListItemIcon>
                <DateRangeIcon />
              </ListItemIcon>
              <ListItemText primary={t("AppbarAdmin.Attendance")} />
            </ListItem>
            <ListItem
              button
              component={Link}
              disabled={location.pathname === PrivateRoutes.Prenotazioni}
              to={PrivateRoutes.Prenotazioni}
            >
              <ListItemIcon>
                <LibraryBooksIcon />
              </ListItemIcon>
              <ListItemText primary={t("AppbarAdmin.Bookings")} />
            </ListItem>
            <ListItem
              button
              component={Link}
              to={PrivateRoutes.Atleti}
              disabled={location.pathname === PrivateRoutes.Atleti}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary={t("AppbarAdmin.Athletes")} />
            </ListItem>
          </List>
        </SwipeableDrawer>
      </Hidden>
    </>
  );
};

type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
  title: {
    flexGrow: 1,
  },
  button: {
    margin: theme.spacing(2),
  },
  drawer: {
    width: 250,
  },
}));

export default AppbarAdmin;
