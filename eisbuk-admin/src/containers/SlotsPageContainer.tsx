import { Badge, Container, IconButton, Switch } from "@material-ui/core";
import {
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Assignment as AssignmentIcon,
} from "@material-ui/icons";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

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

const SlotsPageContainer: React.FC<Props> = ({ slots, children, ...props }) => {
  const classes = useStyles();

  const [enableEdit, setEnableEdit] = useState(false);
  const [showWeekDeleteConfirm, setShowWeekDeleteConfirm] = useState(false);

  const currentDate = useSelector(calendarDaySelector).startOf("week");
  const weekToPaste = useSelector(weekCopyPasteSelector);

  const dispatch = useDispatch();

  const datesToDisplay = Array(7)
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
  const extraButtons = (
    <>
      {enableEdit && (
        <>
          {showWeekDeleteConfirm ? (
            <ConfirmDialog
              title={`Sei sicuro di voler rimuovere tutti gli slot (${
                slotsArray.length
              }) della settimana del ${currentDate.toFormat("d MMMM", {
                locale: "it-IT",
              })}?`}
              open={showWeekDeleteConfirm}
              setOpen={setShowWeekDeleteConfirm}
              onConfirm={doDelete}
            >
              Questa azione non è reversibile
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
              invisible={!Boolean(weekToPaste && weekToPaste.slots)}
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
              +weekToPaste.weekStart === +currentDate // don't paste over the same week we copied
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
