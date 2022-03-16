import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";

import AppBar, { AppBarProps } from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Hidden from "@mui/material/Hidden";
import List from "@mui/material/List";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import PeopleIcon from "@mui/icons-material/People";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import DateRangeIcon from "@mui/icons-material/DateRange";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";

import makeStyles from "@mui/styles/makeStyles";

import { currentTheme, organizationInfo } from "@/themes";

import { NavigationLabel, AdminAria } from "@/enums/translations";
import { PrivateRoutes } from "@/enums/routes";

import DebugMenu from "@/components/layout/DebugMenu";
import BirthdayMenu, { BirthdayDialog } from "@/components/atoms/BirthdayMenu";

import { signOut } from "@/store/actions/authOperations";

import { getLocalAuth } from "@/store/selectors/auth";
import { getCustomersByBirthday } from "@/store/selectors/customers";

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

  const handleClose =
    (action = "") =>
    () => {
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

  const buttons: { label: string; startIcon: JSX.Element; to: string }[] = [
    {
      label: t(NavigationLabel.Attendance),
      startIcon: <DateRangeIcon />,
      to: PrivateRoutes.Root,
    },
    {
      label: "Slots",
      startIcon: <LibraryBooksIcon />,
      to: PrivateRoutes.Slots,
    },
    {
      label: t(NavigationLabel.Athletes),
      startIcon: <PeopleIcon />,
      to: PrivateRoutes.Athletes,
    },
  ];

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
            <MenuItem
              component={Link}
              to={PrivateRoutes.AdminPreferences}
              onClick={handleClose()}
            >
              Settings
            </MenuItem>
          </Menu>
          <Hidden smDown>
            <ButtonGroup color="secondary" aria-label={t(AdminAria.PageNav)}>
              {buttons.map(({ label, to, startIcon }) => {
                const disabled = to === location.pathname;

                return (
                  <Button
                    className={disabled ? classes.disabledButton : ""}
                    key={label}
                    {...{ to, startIcon, disabled }}
                    component={Link}
                    variant="contained"
                    aria-current={location.pathname === to ? "page" : "false"}
                  >
                    {label}
                  </Button>
                );
              })}
              {organizationInfo.name === "DEV" && <DebugMenu />}
            </ButtonGroup>
          </Hidden>

          <BirthdayMenu
            customers={customers}
            onClickShowAll={() => setShowAll(true)}
          />

          <BirthdayDialog
            open={showAll}
            onClose={() => setShowAll(false)}
            customers={customers}
          />

          <Hidden smUp>
            <IconButton
              className={classes.hamburger}
              onClick={() => setDrawerOpen(drawerOpen ? false : true)}
              aria-label={t(AdminAria.PageNav)}
            >
              <MenuIcon />
            </IconButton>
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
            {buttons.map(({ label, startIcon, to }) => {
              const disabled = to === location.pathname;

              return (
                <ListItem
                  button
                  key={label}
                  {...{ to, disabled }}
                  component={Link}
                  className={disabled ? classes.disabledButton : ""}
                  aria-current={location.pathname === to ? "page" : "false"}
                >
                  <ListItemIcon
                    className={disabled ? classes.disabledButton : ""}
                  >
                    {startIcon}
                  </ListItemIcon>
                  <ListItemText primary={label} />
                </ListItem>
              );
            })}
          </List>
        </SwipeableDrawer>
      </Hidden>
    </>
  );
};

type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
  title: {
    marginRight: "auto",
    padding: "0.25rem 0.75rem",
    cursor: "pointer",
    display: "block",
    border: "none",
    borderRadius: "0.25rem",
    "&:hover": {
      boxShadow: `0px 0px 16px ${theme.palette.primary.contrastText}, inset -2px -2px 16px -4px ${theme.palette.primary.contrastText}`,
    },
  },
  button: {
    margin: theme.spacing(2),
  },
  hamburger: { color: "rgba(0, 0, 0, 0.54)", width: 48, height: 48 },
  disabledButton: {
    color: `${theme.palette.primary.main} !important`,
    opacity: "1 !important",
    [theme.breakpoints.up("sm")]: {
      backgroundColor: `${theme.palette.secondary.main} !important`,
      color: `${theme.palette.primary.contrastText} !important`,
      boxShadow: `0px 0px 8px 4px ${theme.palette.secondary.contrastText} !important`,
      zIndex: 1000,
    },
  },
  drawer: {
    width: 250,
  },
}));

export default AppbarAdmin;
