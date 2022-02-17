import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";

import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container";
import Tabs from "@material-ui/core/Tabs";
import Tab, { TabProps } from "@material-ui/core/Tab";

import EventNoteIcon from "@material-ui/icons/EventNote";
import PersonPinIcon from "@material-ui/icons/PersonPin";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { CustomerRoute } from "@/enums/routes";

import { CustomerNavigationLabel } from "@/enums/translations";

/**
 * A placeholder string we use for dynamic route parsing.
 * Implemented by replacing an occurence of placeholder with desired `CustomerRoute` value.
 */
const __placeholder__ = "<customerRoute>";

// #region MainComponent
const CustomerNavigation: React.FC = () => {
  const classes = useStyles();

  const history = useHistory();

  // safely initialize pathname (fallback to empty string if none present)
  const { pathname } = useLocation() || { pathname: "" };

  // all customer routes we're using to test against pathname
  const customerRoutes = Object.values(CustomerRoute);

  // find `CustomerRoute` part in pathname, if any
  const customerRouteInPathname = customerRoutes.find((route) =>
    pathname.includes(route)
  );

  /**
   * A path with `CustomerRoute` from `pathname` (if any) replaced with`<customerRoute>`
   * to be used to parse and insert a dynamic `CustomerRoute` in `LinkTab`
   */
  const asPath = !pathname
    ? // if no pathname provided, default empty string, useEffect will then route to default
      `/${__placeholder__}`
    : !customerRouteInPathname
    ? // if no value for customer route in pathname,
      // add current customerRoute at the end of the pathname
      `${pathname.replace(/\/$/, "")}/${__placeholder__}`
    : // in most common case, replace the found customer route in pathname
      // with current customer route
      pathname.replace(customerRouteInPathname, __placeholder__);

  /**
   * If no `CustomerRoute` value found in `pathname`, redirect to default route
   */
  useEffect(() => {
    if (!customerRouteInPathname) {
      const defaultRoute = asPath.replace(
        __placeholder__,
        CustomerRoute.BookIce
      );
      // here we're using `.replace` rather than `.push`
      // to allow for back navigation (since it's an automatic redirect)
      history.replace(defaultRoute);
    }
  }, [customerRouteInPathname, asPath, history]);

  const handleChange = (e: any, value: CustomerRoute) => {
    if (asPath) {
      const newRoute = asPath.replace(__placeholder__, value);
      history.push(newRoute);
    }
  };

  return (
    <AppBar position="static" className={classes.customerNav}>
      <Container maxWidth="xl">
        <Tabs
          indicatorColor="primary"
          centered
          value={customerRouteInPathname || false}
          onChange={handleChange}
        >
          <LinkTab
            customerRoute={CustomerRoute.BookIce}
            icon={<EventNoteIcon />}
            disabled={customerRouteInPathname === CustomerRoute.BookIce}
            value={CustomerRoute.BookIce}
          />
          <LinkTab
            customerRoute={CustomerRoute.BookOffIce}
            icon={<EventNoteIcon />}
            disabled={customerRouteInPathname === CustomerRoute.BookOffIce}
            value={CustomerRoute.BookOffIce}
          />
          <LinkTab
            customerRoute={CustomerRoute.Calendar}
            icon={<PersonPinIcon />}
            disabled={customerRouteInPathname === CustomerRoute.Calendar}
            value={CustomerRoute.Calendar}
          />
        </Tabs>
      </Container>
    </AppBar>
  );
};
// #endregion MainComponent

// #region LinkTab
type LinkTabProps = Omit<TabProps, "onClick"> & {
  /**
   * A `CustomerRoute` we wish to use this tab for
   */
  customerRoute: CustomerRoute;
};
/**
 * A custom component for Material-UI `Tab` we're using to serve as a
 * `Link` component with some use-case specific functionality
 */
const LinkTab: React.FC<LinkTabProps> = ({ customerRoute, ...props }) => {
  const { t } = useTranslation();

  const label = t(CustomerNavigationLabel[customerRoute]);

  return <Tab aria-label={customerRoute} {...{ ...props, label }} />;
};
// #endregion LinkTab

// #region styles
const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBarSpacer: theme.mixins.toolbar,
  customerNav: {
    backgroundColor: theme.palette.secondary.main,
  },
}));
// #endregion styles

export default CustomerNavigation;
