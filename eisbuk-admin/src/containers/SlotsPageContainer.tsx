import { Badge, Container, IconButton, Switch } from "@material-ui/core";
import {
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Assignment as AssignmentIcon,
} from "@material-ui/icons";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import { makeStyles } from "@material-ui/core/styles";
import _ from "lodash";

import { LocalStore } from "@/types/store";

import DateNavigationAppBar from "./DateNavigationAppBar";
import SlotListByDay, { SlotListProps } from "@/components/slots/SlotListByDay";
import ConfirmDialog from "@/components/global/ConfirmDialog";

import { shiftSlotsWeek } from "@/data/slotutils";

import { ETheme } from "@/themes";

import {
  copySlotWeek,
  createSlots,
  deleteSlots,
} from "@/store/actions/actions";
import { calendarDaySelector } from "@/store/selectors";
import { DateTime } from "luxon";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {},
  slotlist: {
    "& > li.MuiListSubheader-sticky": {
      top: theme.mixins.toolbar.minHeight,
    },
  },
}));

/** @TODO make this imported selector */
const weekCopyPasteSelector = (state: LocalStore) => state.copyPaste.week;

type Props = Omit<Omit<SlotListProps, "enableEdit">, "className">;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SlotsPageContainer: React.FC<Props> = ({ slots, children, ...props }) => {
  const classes = useStyles();

  const [enableEdit, setEnableEdit] = useState(false);
  const [showWeekDeleteConfirm, setShowWeekDeleteConfirm] = useState(false);

  const currentDate = useSelector(calendarDaySelector).startOf("week");
  const weekToPaste = useSelector(weekCopyPasteSelector);

  const dispatch = useDispatch();

  /**
   * generates dates to display based on the view
   * 7 days of the week in case of ice slots
   * 4-5 Mondays, Tuesdays, etc.of the month in case of off-ice
   * @param str sview passed from props
   * @returns array of dates to display
   */
  const datesToDisplay =
    props.view === "iceSlots"
      ? Array(5)
          .fill(null)
          .map((_, i) => currentDate.plus({ week: i }).toISODate())
          .filter((date) =>
            DateTime.fromISO(date).hasSame(currentDate, "month")
          )
      : Array(7)
          .fill(null)
          .map((_, i) => currentDate.plus({ days: i }).toISODate());

  const slotsToDisplay = {
    // create empty days
    ..._.zipObject(datesToDisplay, [{}, {}, {}, {}, {}, {}, {}]),
    // if slots available, overwrite empty days
    ..._.pick(slots, datesToDisplay),
  };

  const slotsArray = _.values(
    _.values(slotsToDisplay).reduce((acc, el) => ({ ...acc, ...el }), {})
  );
  const doPaste = () => {
    if (weekToPaste) {
      dispatch(
        createSlots(
          shiftSlotsWeek(weekToPaste.slots, weekToPaste.weekStart, currentDate)
        )
      );
    }
  };
  const switchButton = props.onDelete ? (
    <Switch
      edge="end"
      onChange={() => {
        setEnableEdit(!enableEdit);
      }}
      checked={enableEdit}
    />
  ) : null;
  const doDelete = () => {
    dispatch(deleteSlots(slotsArray));
  };
  const { t } = useTranslation();

  const extraButtons = (
    <>
      {enableEdit && (
        <>
          {showWeekDeleteConfirm ? (
            <ConfirmDialog
              title={`${t("SlotsPageContainer.DeleteAllConfirmation")} (${
                slotsArray.length
              }) ${t("SlotsPageContainer.OfTheWeek")} ${t(
                "SlotsPageContainer.CurrentDate",
                {
                  date: currentDate,
                }
              )}?`}
              open={showWeekDeleteConfirm}
              setOpen={setShowWeekDeleteConfirm}
              onConfirm={doDelete}
            >
              {t("SlotsPageContainer.NonReversible")}
            </ConfirmDialog>
          ) : null}

          <IconButton
            size="small"
            disabled={slotsArray.length === 0}
            onClick={() => setShowWeekDeleteConfirm(true)}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            disabled={slotsArray.length === 0}
            onClick={() =>
              dispatch(
                copySlotWeek({ weekStart: currentDate, slots: slotsArray })
              )
            }
          >
            <Badge
              color="secondary"
              variant="dot"
              invisible={!(weekToPaste && weekToPaste.slots)}
            >
              <FileCopyIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="small"
            onClick={doPaste}
            disabled={
              !weekToPaste ||
              !weekToPaste.weekStart || // there's nothing to paste
              Number(weekToPaste.weekStart) === Number(currentDate) // don't paste over the same week we copied
            }
          >
            <AssignmentIcon />
          </IconButton>
        </>
      )}
      {switchButton}
    </>
  );

  return (
    <>
      <DateNavigationAppBar extraButtons={extraButtons} />
      <Container maxWidth="xl">
        <SlotListByDay
          className={classes.slotlist}
          slots={slotsToDisplay}
          enableEdit={enableEdit}
          {...props}
        />
      </Container>
    </>
  );
};

export default SlotsPageContainer;
