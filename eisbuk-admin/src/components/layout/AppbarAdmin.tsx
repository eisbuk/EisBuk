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
          </Menu>
          <Hidden xsDown>
            <ButtonGroup color="secondary" aria-label={t(AdminAria.PageNav)}>
              {buttons.map(({ label, ...buttonProps }) => {
                const disabled = buttonProps.to === location.pathname;

                return (
                  <Button
                    className={disabled ? classes.disabledButton : ""}
                    key={label}
                    {...{ ...buttonProps, disabled }}
                    component={Link}
                    variant="contained"
                    aria-current={
                      location.pathname === PrivateRoutes.Root
                        ? "page"
                        : "false"
                    }
                  >
                    {label}
                  </Button>
                );
              })}
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
          />
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
                  aria-current={
                    location.pathname === PrivateRoutes.Root ? "page" : "false"
                  }
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
