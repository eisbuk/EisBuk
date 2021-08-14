import React, { useState, useEffect } from "react";
import { DateTime, DurationObjectUnits } from "luxon";
import i18n from "i18next";
import { useHistory, useLocation, useParams } from "react-router-dom";

import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { luxon2ISODate } from "@/utils/date";

import { __incrementId__, __decrementId__ } from "./__testData__/testData";
import { set } from "lodash";

/**
 * A render function passed as child for render prop usage
 */
interface RenderFunction {
  (params: {
    /**
     * Date of start of currently viewed timeframe in ISO string format
     */
    currentViewStart: DateTime;
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
}) => {
  const classes = useStyles();

  // route params (used in 'withRouter' scenario)
  const { date: routeDateISO } = useParams<{ date: string }>();
  const { pathname } = useLocation();
  const history = useHistory();
  const routeDate = processDateParam(routeDateISO);

  // ISO date string representation of current time.
  // Used for calculating of the fallback default time
  const fallbackDate = getFallbackDate(jump);
  const initialStartTime = withRouter
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
   * - if route `date` param is defined, but different from local state, update local state accordingly
   */
  useEffect(() => {
    const localDateISO = luxon2ISODate(currentViewStart);
    if (withRouter && routeDateISO !== localDateISO) {
      if (!routeDate) {
        const pathnameWithLocalDate = `${pathname}/${localDateISO}`;
        history.push(pathnameWithLocalDate);
      } else {
        setCurrentViewStart(routeDate);
      }
    }
  });

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

  return (
    <>
      <AppBar position="sticky">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            className={classes.prev}
            color="inherit"
            aria-label="menu"
            data-testid={__decrementId__}
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
            data-testid={__incrementId__}
            onClick={switchTimeframe("increment")}
          >
            <ChevronRightIcon />
          </IconButton>
          {/* {extraButtons} */}
        </Toolbar>
      </AppBar>
      {children ? children({ currentViewStart }) : null}
    </>
  );
};

/**
 * Returns a fallback date (start of next timeframe) if no default date is provided.
 *
 * We're using a function here to allow for easier and consistent testing (mocking).
 * @returns start of next timeframe in DateTime format
 */
const getFallbackDate = (jump: keyof DurationObjectUnits) =>
  DateTime.fromJSDate(new Date(Date.now()))
    .startOf(jump)
    .plus({ [`${jump}s`]: 1 });

/**
 * Creates a title from start time and timeframe lenght.
 * @param startDate start date of current timeframe
 * @param jump timeframe length
 * @returns string to be used as title of the component
 */
const createDateTitle = (
  startDate: DateTime,
  jump: keyof DurationObjectUnits
): string => {
  switch (jump) {
    // for monthly view we're using the full month string
    case "month":
      return i18n.t("DateNavigationBar.Month", {
        date: startDate,
      });

    // for day view we're using the specialized day string format
    case "day":
      return i18n.t("DateNavigationBar.Day", { date: startDate });

    // for week and other views we're using standardized format: showing first and last date within the timeframe
    default:
      const jumpKey = `${jump}s`;

      const startDateString = i18n.t("DateNavigationBar.Week", {
        date: startDate,
      });
      const endDateString = i18n.t("DateNavigationBar.Week", {
        date: startDate.plus({ [jumpKey]: 1, days: -1 }),
      });

      return [startDateString, endDateString].join(" - ");
  }
};

/**
 * Helper function used to safely process date recieved from param.
 * We're using this to return parsed DateTime if input `dateISO` exists and is parsable.
 * @param dateISO string or undefined: date received from param for parsing
 * @returns
 * - parsed date in DateTime format
 * - `undefined` if date not passed or not parsable
 */
const processDateParam = (dateISO?: string): DateTime | undefined => {
  // fail early if dateISO undefined
  if (!dateISO) return undefined;

  // try and parse the date
  const parsedDate = DateTime.fromISO(dateISO);

  // return undefined if the date was not parsed correctly
  return !parsedDate.invalidReason ? parsedDate : undefined;
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
