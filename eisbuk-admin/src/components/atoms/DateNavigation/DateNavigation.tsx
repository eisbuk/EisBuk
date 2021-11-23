/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { DateTime, DateTimeUnit } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import Toolbar from "@material-ui/core/Toolbar";
import AppBar, { AppBarProps } from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Switch from "@material-ui/core/Switch";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { changeCalendarDate } from "@/store/actions/appActions";

import { getCalendarDay } from "@/store/selectors/app";

import { createDateTitle } from "./utils";

import { __toggleId__ } from "./__testData__/testData";

import { __dateNavNextId__, __dateNavPrevId__ } from "@/__testData__/testIds";

/**
 * A render function passed as child for render prop usage
 */
interface RenderFunction {
  (params: {
    /**
     * - `boolean` state of the toggle button
     * - `undefined` if `showToggle = false`
     */
    toggleState?: boolean;
  }): JSX.Element | null | string;
}

interface Props extends AppBarProps {
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
  jump?: DateTimeUnit;
  /**
   * A flag used to trigger syncing local date with the router (both read and push)
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
  jump = "week",
  extraButtons = null,
  ...props
}) => {
  const classes = useStyles();

  const reduxDate = useSelector(getCalendarDay);
  const dispatch = useDispatch();

  /**
   * Set default date to redux store on mount.
   */
  useEffect(() => {
    if (defaultDate) {
      // correct default date to start of timeframe (if not already)
      const safeDefaultDate = defaultDate.startOf(jump);
      dispatch(changeCalendarDate(safeDefaultDate));
    }
  }, []);

  /**
   * If switching to "month" view after "week" view,
   * check and update route date to start of "month" (if not so already)
   */
  useEffect(() => {
    const correctedDate = reduxDate.startOf(jump);
    if (!reduxDate.equals(correctedDate)) {
      dispatch(changeCalendarDate(correctedDate));
    }
  }, [jump]);

  /**
   * Handler we're using for pagination.
   * It calculates the new date based on action (`increment` or `decrement`)
   * and `jump` value to increment/decrement the current date with appropriate timespan
   * and dispatches the date to redux store
   * @param action `"increment"` or `"decrement"`
   */
  const paginate = (action: "increment" | "decrement") => () => {
    // increment factor
    const increment = action === "increment" ? 1 : -1;

    // processed `jump` value to be compatible with `DateTime.plus()` options object
    const key = `${jump}s`;

    const newTimeframeStart = reduxDate.plus({ [key]: increment });
    dispatch(changeCalendarDate(newTimeframeStart));
  };

  /**
   * State of toggle button (if one is used).
   * It gets passed to render function for usage at
   * lower points in component tree
   */
  const [toggleState, setToggleState] = useState(
    showToggle ? false : undefined
  );
  const toggleButton = (
    <Switch
      edge="end"
      onChange={(_, checked) => setToggleState(checked)}
      checked={toggleState}
      aria-label="Toggle visibility of slot operation buttons."
      data-testid={__toggleId__}
    />
  );

  /**
   * Controll showing of extra buttons (right next to toggle).
   * If no toggle is used, the buttons should be visible, if it is,
   * the showing of the buttons depends on the toggle state.
   */
  const showExtraButtons = toggleState || !showToggle;

  return (
    <>
      <AppBar {...props} position="sticky">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            className={classes.prev}
            color="inherit"
            aria-label="menu"
            data-testid={__dateNavPrevId__}
            onClick={paginate("decrement")}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant="h6"
            color="inherit"
            className={classes.selectedDate}
          >
            {createDateTitle(reduxDate, jump)}
          </Typography>
          <IconButton
            edge="start"
            className={classes.next}
            color="inherit"
            aria-label="menu"
            data-testid={__dateNavNextId__}
            onClick={paginate("increment")}
          >
            <ChevronRightIcon />
          </IconButton>
          {showExtraButtons && extraButtons}
          {showToggle && toggleButton}
        </Toolbar>
      </AppBar>
      <div className={classes.childrenContainer}>
        {children ? children({ toggleState }) : null}
      </div>
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
  childrenContainer: {
    paddingBottom: "2rem",
  },
}));

export default DateNavigation;
