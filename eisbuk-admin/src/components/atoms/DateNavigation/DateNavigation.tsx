import React, { useState, useEffect, useMemo } from "react";
import { DateTime, DurationObjectUnits } from "luxon";
import { useHistory, useLocation, useParams } from "react-router-dom";

import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Switch from "@material-ui/core/Switch";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { luxon2ISODate } from "@/utils/date";
import { createDateTitle, getFallbackDate, processDateParam } from "./utils";

import { __toggleId__ } from "./__testData__/testData";

import { __dateNavNextId__, __dateNavPrevId__ } from "@/__testData__/testIds";
import { __isStorybook__, __storybookDate__ } from "@/lib/constants";

/**
 * A render function passed as child for render prop usage
 */
interface RenderFunction {
  (params: {
    /**
     * Date of start of currently viewed timeframe in ISO string format
     */
    currentViewStart: DateTime;
    /**
     * - `boolean` state of the toggle button
     * - `undefined` if `showToggle = false`
     */
    toggleState?: boolean;
  }): JSX.Element | null | string;
}

interface Props {
  /**
   * Render function passed as children for readability
   */
  children?: RenderFunction;
  /**
   * A flag used to trigger showing of toggle button
   */
  showToggle?: boolean;
  /**
   * Default (initial) timeframe start date, ISO string format
   */
  defaultDate?: DateTime;
  /**
   * Value for next/prev timeframe start time calculation
   */
  jump?: keyof DurationObjectUnits;
  /**
   * A flag used to trigger syncing local date with the router (both read and push)
   */
  withRouter?: boolean;
  /**
   * Additional buttons to be rendered on the right hand side of the navbar.
   * Will be shown if:
   * - `showToggle == true` will be displayed depending on `toggleState` i.e. if `toggleState == true`
   * - `showToggle == false` will be rendered immediately
   */
  extraButtons?: JSX.Element | null;
}

/**
 * A render prop component used to navigate between dates and pass some of it's state to unknown children.
 */
const DateNavigation: React.FC<Props> = ({
  children,
  showToggle,
  defaultDate,
  withRouter = false,
  jump = "week",
  extraButtons = null,
}) => {
  const classes = useStyles();

  // route params (used in 'withRouter' scenario)
  const { date: routeDateISO } = useParams<{ date: string }>();
  const { pathname } = useLocation();
  const history = useHistory();
  const routeDate = useMemo(() => processDateParam(routeDateISO), [
    routeDateISO,
  ]);

  // ISO date string representation of current time.
  // Used for calculating of the fallback default time
  const fallbackDate = getFallbackDate(jump);
  const initialStartTime = __isStorybook__
    ? // set standardized date if in storybook env
      DateTime.fromISO(__storybookDate__)
    : withRouter
    ? routeDate || defaultDate || fallbackDate
    : defaultDate || fallbackDate;
  // we're employing fault tolerance here:
  // if initial start time is not the beginning of the timeframe (defined by jump),
  // will be corrected to `.startOf`
  const safeInitialStartTime = initialStartTime.startOf(jump);

  const [currentViewStart, setCurrentViewStart] = useState<DateTime>(
    safeInitialStartTime
  );

  /**
   * Handle synchronization of the route and the local state (if `withRouter = true`):
   * - if route `date` param is undefined, push default date to the route
   * - if route `date` param is defined, but different from local state, update local state accordinglyz
   */
  useEffect(() => {
    const localDateISO = luxon2ISODate(currentViewStart);
    if (!__isStorybook__ && withRouter && routeDateISO !== localDateISO) {
      if (!routeDate) {
        const pathnameWithLocalDate = `${pathname.replace(
          /\/$/,
          ""
        )}/${localDateISO}`;
        history.push(pathnameWithLocalDate);
      } else {
        setCurrentViewStart(routeDate);
      }
    }
  }, [
    setCurrentViewStart,
    routeDateISO,
    withRouter,
    history,
    pathname,
    currentViewStart,
    routeDate,
  ]);

  /**
   * If switching to "month" view after "week" view,
   * check and update route date to start of "month" (if not so already)
   */
  useEffect(() => {
    if (routeDateISO) {
      const localDateISO = luxon2ISODate(currentViewStart);
      const correctedDate = currentViewStart.startOf(jump);
      const correctedDateISO = luxon2ISODate(correctedDate);
      if (localDateISO !== correctedDateISO) {
        const pathnameWithCorrectedDate = pathname.replace(
          routeDateISO,
          correctedDateISO
        );
        history.push(pathnameWithCorrectedDate);
      }
    }
  }, [jump, currentViewStart, routeDateISO, history, pathname]);

  /**
   * Handler we're using for pagination.
   * It calculates the new date based on action (`increment` or `decrement`)
   * and `jump` value to increment/decrement the current date with appropriate timespan.
   * The new date is:
   * - updated to the local state if `withRouter = false`
   * - pushed to the route if `withRouter = true` and the local state update is subsquently handled through `useEffect`
   * @param action `"increment"` or `"decrement"`
   */
  const switchTimeframe = (action: "increment" | "decrement") => () => {
    // increment factor
    const increment = action === "increment" ? 1 : -1;

    // processed `jump` value to be compatible with `DateTime.plus()` options object
    const key = `${jump}s`;

    const newTimeframeStart = currentViewStart.plus({ [key]: increment });
    const newTimeframeStartISO = newTimeframeStart.toISO().substr(0, 10);

    if (withRouter) {
      // edit existing path: update date param
      const newPath = pathname.replace(routeDateISO, newTimeframeStartISO);
      history.push(newPath);
    } else {
      setCurrentViewStart(newTimeframeStart);
    }
  };

  const [toggleState, setToggleState] = useState(
    showToggle ? false : undefined
  );
  const toggleButton = (
    <Switch
      edge="end"
      onChange={(_, checked) => setToggleState(checked)}
      checked={toggleState}
      data-testid={__toggleId__}
    />
  );

  // if 'showToggle == true', we're showing `extraButtons` depending on `toggleState`
  // if `showToggle == false`, we're showing toggleState buttons immediately
  const showExtraButtons = toggleState || !showToggle;

  return (
    <>
      <AppBar position="sticky">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            className={classes.prev}
            color="inherit"
            aria-label="menu"
            data-testid={__dateNavPrevId__}
            onClick={switchTimeframe("decrement")}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant="h6"
            color="inherit"
            className={classes.selectedDate}
          >
            {createDateTitle(currentViewStart, jump)}
          </Typography>
          <IconButton
            edge="start"
            className={classes.next}
            color="inherit"
            aria-label="menu"
            data-testid={__dateNavNextId__}
            onClick={switchTimeframe("increment")}
          >
            <ChevronRightIcon />
          </IconButton>
          {showExtraButtons && extraButtons}
          {showToggle && toggleButton}
        </Toolbar>
      </AppBar>
      {children ? children({ currentViewStart, toggleState }) : null}
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  appbar: {
    flexGrow: 0,
  },
  selectedDate: {
    flexGrow: 6,
    textAlign: "center",
  },
  prev: {
    flexGrow: 1,
  },
  next: {
    flexGrow: 1,
  },
  "& .MuiAppBar-positionSticky": {
    top: theme.mixins.toolbar.top,
  },
}));

export default DateNavigation;
