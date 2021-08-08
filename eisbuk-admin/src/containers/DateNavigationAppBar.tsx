import React, { useMemo } from "react";
import { DateTime, DurationObjectUnits } from "luxon";
import { useDispatch, useSelector } from "react-redux";
import i18n from "i18next";

import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { ETheme } from "@/themes";

import { changeCalendarDate } from "@/store/actions/appActions";

import { getStartForCurrentTimeframe } from "@/store/selectors/app";

const JUMPS = {
  week: {
    display: (currentDate: DateTime) =>
      i18n.t("DateNavigationBar.Week", { date: currentDate }) +
      " — " +
      i18n.t("DateNavigationBar.Week", { date: currentDate.plus({ days: 6 }) }),
    delta: {
      days: 7,
    },
  },
  day: {
    display: (currentDate: DateTime) =>
      i18n.t("DateNavigationBar.Day", { date: currentDate }),
    delta: {
      days: 1,
    },
  },
};

/**
 * Returns a new copy (pure) of the passed object with each value multiplied by the passed factor
 * @param factor multiplication factor
 * @param delta object to multiply
 * @returns
 */
const multiply = (factor: number, delta: Record<string, number>) =>
  Object.keys(delta).reduce((acc, key) => {
    acc[key] = delta[key] * factor;
    return acc;
  }, {});

interface Props {
  extraButtons?: JSX.Element;
  jump?: keyof DurationObjectUnits;
}

const DateNavigationAppBar: React.FC<Props> = ({
  extraButtons,
  jump = "week",
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  // memoized selector for current time "jump"
  // we're using useMemo here (instead of useCallback)
  // because we want to memoize the result of `getStartForCurrentTimeframe` HOF with respect to "jump"
  // even though the result is a (selector) function
  const getStartOfTimeframe = useMemo(() => getStartForCurrentTimeframe(jump), [
    jump,
  ]);

  const currentDate = useSelector(getStartOfTimeframe);
  const adjustCalendarDate = (factor: number) => {
    dispatch(
      changeCalendarDate(currentDate.plus(multiply(factor, JUMPS[jump].delta)))
    );
  };

  return (
    <AppBar position="sticky">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          className={classes.prev}
          color="inherit"
          aria-label="menu"
          onClick={() => adjustCalendarDate(-1)}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant="h6"
          color="inherit"
          className={classes.selectedDate}
        >
          {JUMPS[jump].display(currentDate)}
        </Typography>
        <IconButton
          edge="start"
          className={classes.next}
          color="inherit"
          aria-label="menu"
          onClick={() => adjustCalendarDate(1)}
        >
          <ChevronRightIcon />
        </IconButton>
        {extraButtons}
      </Toolbar>
    </AppBar>
  );
};

const useStyles = makeStyles((theme: ETheme) => ({
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

export default DateNavigationAppBar;
