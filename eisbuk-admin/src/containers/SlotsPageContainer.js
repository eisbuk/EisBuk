import { Badge, Container, IconButton, Switch } from "@material-ui/core";
import {
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Assignment as AssignmentIcon,
} from "@material-ui/icons";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import SlotListByDay from "../components/slots/SlotListByDay";

import { makeStyles } from "@material-ui/core/styles";

import DateNavigationAppBar from "./DateNavigationAppBar";
import ConfirmDialog from "../components/global/ConfirmDialog";
import { calendarDaySelector } from "../store/selectors";
import { shiftSlotsWeek } from "../data/slotutils.js";
import {
  copySlotWeek,
  createSlots,
  deleteSlots,
} from "../store/actions/actions";
import _ from "lodash";

const useStyles = makeStyles((theme) => ({
  root: {},
  slotlist: {
    "& > li.MuiListSubheader-sticky": {
      top: theme.mixins.toolbar.minHeight,
    },
  },
}));

const weekCopyPasteSelector = (state) => state.copyPaste.week ?? {};

export default ({
  slots,
  onDelete,
  onSubscribe,
  onUnsubscribe,
  onCreateSlot,
  onEditSlot,
  subscribedSlots,
  view,
  isCustomer,
}) => {
  const classes = useStyles();
  const [enableEdit, setEnableEdit] = useState(false);
  const [showWeekDeleteConfirm, setShowWeekDeleteConfirm] = useState(false);
  const currentDate = useSelector(calendarDaySelector).startOf("week");
  const weekToPaste = useSelector(weekCopyPasteSelector);
  const dispatch = useDispatch();

  const datesToDisplay = [...Array(7).keys()].map((i) =>
    currentDate.plus({ days: i }).toISODate()
  );
  const slotsToDisplay = {
    ..._.zipObject(datesToDisplay, [[], [], [], [], [], [], []]),
    ..._.pick(slots, datesToDisplay),
  };
  const slotsArray = _.values(
    _.values(slotsToDisplay).reduce((acc, el) => ({ ...acc, ...el }), {})
  );
  const doPaste = () =>
    dispatch(
      createSlots(
        shiftSlotsWeek(weekToPaste.slots, weekToPaste.weekStart, currentDate)
      )
    );
  const switchButton = onDelete ? (
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
            variant="outlined"
            size="small"
            disabled={slotsArray.length === 0}
            onClick={() => setShowWeekDeleteConfirm(true)}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            variant="outlined"
            size="small"
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
            variant="outlined"
            size="small"
            onClick={doPaste}
            tooltip="Incolla settimana"
            disabled={
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
          onDelete={onDelete}
          {...{
            onSubscribe,
            onUnsubscribe,
            subscribedSlots,
            onCreateSlot,
            onEditSlot,
            enableEdit,
            view,
            isCustomer,
          }}
        />
      </Container>
    </>
  );
};
