import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";

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

import { NavigationLabel, AdminAria } from "@/enums/translations";
import { PrivateRoutes } from "@/enums/routes";

import DebugMenu from "@/components/layout/DebugMenu";
import BirthdayMenu from "@/components/atoms/BirthdayMenu/BirthdayMenu";

import { signOut } from "@/store/actions/authOperations";

import { getLocalAuth } from "@/store/selectors/auth";
import { getCustomersByBirthday } from "@/store/selectors/customers";
import BirthdayDialog from "../atoms/BirthdayMenu/BirthdayDialog";

const AppbarAdmin: React.FC<AppBarProps> = (props) => {
  const classes = useStyles();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const dispatch = useDispatch();

  const userAuthInfo = useSelector(getLocalAuth);

  const customers = useSelector(
    getCustomersByBirthday(DateTime.now().toISODate())
  );

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
  const currentUser = userAuthInfo?.email || userAuthInfo?.phoneNumber || "";
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

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
            <ButtonGroup color="secondary" aria-label={t(AdminAria.PageNav)}>
              <Button
                component={Link}
                to={PrivateRoutes.Root}
                variant="contained"
                startIcon={<DateRangeIcon />}
                disabled={location.pathname === PrivateRoutes.Root}
                aria-current={
                  location.pathname === PrivateRoutes.Root ? "page" : "false"
                }
              >
                {t(NavigationLabel.Attendance)}
              </Button>
              <Button
                component={Link}
                to={PrivateRoutes.Slots}
                variant="contained"
                startIcon={<LibraryBooksIcon />}
                disabled={location.pathname === PrivateRoutes.Slots}
                aria-current={
                  location.pathname === PrivateRoutes.Slots ? "page" : "false"
                }
              >
                Slots
              </Button>
              <Button
                component={Link}
                to={PrivateRoutes.Athletes}
                variant="contained"
                startIcon={<PeopleIcon />}
                disabled={location.pathname === PrivateRoutes.Athletes}
                aria-current={
                  location.pathname === PrivateRoutes.Athletes
                    ? "page"
                    : "false"
                }
              >
                {t(NavigationLabel.Athletes)}
              </Button>

              {organizationInfo.name === "DEV" && <DebugMenu />}
            </ButtonGroup>
          </Hidden>
          <Hidden smUp>
            <Button
              onClick={() => setDrawerOpen(drawerOpen ? false : true)}
              aria-label={t(AdminAria.PageNav)}
            >
              <MenuIcon />
            </Button>
          </Hidden>

          <BirthdayMenu
            customers={customers}
            onClickShowAll={() => setShowAll(true)}
          />

          <BirthdayDialog
            open={showAll}
            onClose={() => setShowAll(false)}
            customers={customers}
          ></BirthdayDialog>
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
              aria-current={
                location.pathname === PrivateRoutes.Root ? "page" : "false"
              }
            >
              <ListItemIcon>
                <DateRangeIcon />
              </ListItemIcon>
              <ListItemText primary={t(NavigationLabel.Attendance)} />
            </ListItem>
            <ListItem
              button
              component={Link}
              to={PrivateRoutes.Slots}
              disabled={location.pathname === PrivateRoutes.Slots}
              aria-current={
                location.pathname === PrivateRoutes.Slots ? "page" : "false"
              }
            >
              <ListItemIcon>
                <LibraryBooksIcon />
              </ListItemIcon>
              <ListItemText primary={t(NavigationLabel.Bookings)} />
            </ListItem>
            <ListItem
              button
              component={Link}
              to={PrivateRoutes.Athletes}
              disabled={location.pathname === PrivateRoutes.Athletes}
              aria-current={
                location.pathname === PrivateRoutes.Athletes ? "page" : "false"
              }
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary={t(NavigationLabel.Athletes)} />
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
