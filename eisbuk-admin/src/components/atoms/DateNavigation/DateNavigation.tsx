import React, { useEffect, useState } from "react";
import { DateTime, DateTimeUnit } from "luxon";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Toolbar from "@mui/material/Toolbar";
import AppBar, { AppBarProps } from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import makeStyles from "@mui/styles/makeStyles";

import { changeCalendarDate } from "@/store/actions/appActions";

import { getCalendarDay } from "@/store/selectors/app";

import { createDateTitle } from "./utils";

import { __toggleId__ } from "./__testData__/testData";

import { AdminAria } from "@/enums/translations";

import DateSwitcher from "@/components/atoms/DateSwitcher/DateSwitcher";

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

  const { t } = useTranslation();

  const reduxDate = useSelector(getCalendarDay);
  const currentDate = reduxDate.startOf(jump);
  const dispatch = useDispatch();

  /**
   * Set redux calendar date if "default date" has been specified.
   * This should be ran only once (when the component loads), or each
   * time a component reloads with different props (`defaultDate`),
   * meaning it has been rendered in different page views
   */
  useEffect(() => {
    if (defaultDate) {
      dispatch(changeCalendarDate(defaultDate));
    }
  }, [defaultDate]);

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
      aria-label={t(AdminAria.ToggleSlotOperations)}
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
            aria-label={t(AdminAria.SeePastDates)}
            data-testid={__dateNavPrevId__}
            onClick={paginate("decrement")}
            size="large"
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant="h6"
            color="inherit"
            className={classes.selectedDate}
          >
            {createDateTitle(currentDate, jump)}
          </Typography>
          <IconButton
            edge="start"
            className={classes.next}
            color="inherit"
            aria-label={t(AdminAria.SeeFutureDates)}
            data-testid={__dateNavNextId__}
            onClick={paginate("increment")}
            size="large"
          >
            <ChevronRightIcon />
          </IconButton>
          <DateSwitcher currentDate={currentDate} />
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
