import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";

import {
  AppBar,
  Button,
  ButtonGroup,
  Hidden,
  List,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  SwipeableDrawer,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import {
  People as PeopleIcon,
  LibraryBooks as LibraryBooksIcon,
  DateRange as DateRangeIcon,
  Menu as MenuIcon,
} from "@material-ui/icons";

import { currentTheme, organizationInfo } from "@/themes";

import { PrivateRoutes } from "@/enums/routes";

import DebugMenu from "@/components/layout/DebugMenu";

import { signOut } from "@/store/actions/authOperations";

import { getFirebaseAuth } from "@/store/selectors/auth";

const AppbarAdmin: React.FC = () => {
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
      <AppBar position="static" className={(classes as any).appBar}>
        <Toolbar className={(classes as any).toolbar}>
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
              <ListItemText primary={t("AppbarAdmin.Reservations")} />
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
