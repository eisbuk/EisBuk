import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isLoaded, isEmpty } from "react-redux-firebase";
import { makeStyles } from "@material-ui/core/styles";
import {
  IconButton,
  ListSubheader,
  Grid,
  Typography,
  Box,
} from "@material-ui/core";
import LuxonUtils from "@date-io/luxon";
import { DateTime } from "luxon";
import _ from "lodash";

import FileCopyIcon from "@material-ui/icons/FileCopy";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import AssignmentIcon from "@material-ui/icons/Assignment";

import { Slot as SlotInterface } from "eisbuk-shared";

import { __isStorybook__ } from "@/lib/constants";

import { LocalStore } from "@/types/store";

import { ETheme } from "@/themes";

import {
  copySlotDay,
  createSlots,
  deleteSlotFromClipboard,
  addSlotToClipboard,
} from "@/store/actions/actions";
import { calendarDaySelector } from "@/store/selectors";

import CustomerAreaBookingCard from "@/components/customerArea/CustomerAreaBookingCard";
import Slot, { SlotProps } from "./Slot";

import { shiftSlotsDay } from "@/data/slotutils";

const luxon = new LuxonUtils({ locale: "C" });

/** @TODO refactor to use imported selector */
const dayCopyPasteSelector = (state: LocalStore) => state.copyPaste.day ?? {};

type SimplifiedSlotProps = Omit<Omit<SlotProps, "data">, "deleted">;

export interface SlotsDayProps extends SimplifiedSlotProps {
  slots: Record<string, SlotInterface<"id">>;
  day: string;
  enableEdit?: boolean;
  view?: string;
  isCustomer?: boolean;
}

const SlotsDay: React.FC<SlotsDayProps> = ({
  slots,
  day,
  subscribedSlots,
  enableEdit = false,
  view = "slots",
  isCustomer = false,
  setCreateEditDialog = () => {},
  onSubscribe,
  onUnsubscribe,
  onDelete,
}) => {
  subscribedSlots = subscribedSlots || {};
  const [deletedSlots, setDeletedSlots] = useState({});

  const dispatch = useDispatch();

  const auth = useSelector((state: LocalStore) => state.firebase.auth);

  const luxonDay = luxon.parse(day, "yyyy-LL-dd");
  const dateStr = luxonDay.toFormat("EEEE d MMMM", { locale: "it-IT" });

  /** @TODO rewrite to use imported selector */
  const copiedWeek = useSelector((state: LocalStore) => state.copyPaste.week);

  const copiedWeekSlots = copiedWeek
    ? copiedWeek.slots.map((slot) => slot.id)
    : [];

  const checkSelected = (id: SlotInterface<"id">["id"]) =>
    copiedWeekSlots.includes(id);

  const currentWeek = useSelector(calendarDaySelector).startOf("week");

  const canClickSlots =
    enableEdit &&
    copiedWeekSlots.length > 0 &&
    copiedWeek?.weekStart.equals(currentWeek);

  const extendedOnDelete =
    onDelete && enableEdit
      ? (slot: SlotInterface<"id">) => {
          // In order to get a more responsive UI we remember here the IDs of slots
          // that should be deleted. Firestore already short-circuits updates sent
          // to the server before receiving a reply, but here we'll be relying on
          // secondary data i.e. to see the update we'd need to wait for a server
          // side trigger function to update the aggregated collection
          setDeletedSlots({ ...deletedSlots, [slot.id]: true });
          onDelete(slot);
        }
      : undefined;

  const slotsList = _.sortBy(_.values(slots), (el) => el.date.seconds);
  const classes = useStyles();
  const dayInClipboard = useSelector(dayCopyPasteSelector);
  const showCreateForm = () => {
    setCreateEditDialog({
      isOpen: true,
      day: day,
      slotToEdit: null,
    });
  };

  const doPaste = () =>
    dispatch(createSlots(shiftSlotsDay(Object.values(dayInClipboard), day)));

  const newSlotButton = enableEdit && (
    <>
      <IconButton size="small" onClick={showCreateForm}>
        <AddCircleOutlineIcon />
      </IconButton>
    </>
  );

  const canChange =
    // override checks in case of storybook
    __isStorybook__ ||
    (isLoaded(auth) && !isEmpty(auth)) ||
    luxonDay.millisecond > DateTime.local().endOf("month").millisecond;

  return (
    <>
      {view === "slots" ? (
        <>
          <ListSubheader key={day + "-title"} className={classes.listSubheader}>
            <Typography display="inline" variant="h4" className={classes.date}>
              {dateStr}
            </Typography>
            <Box display="flex" className={classes.dateButtons}>
              {newSlotButton}
              {enableEdit && Boolean(slotsList.length) && (
                <IconButton
                  size="small"
                  onClick={() => dispatch(copySlotDay(slots))}
                >
                  <FileCopyIcon />
                </IconButton>
              )}
              {enableEdit && Object.keys(dayInClipboard).length > 0 && (
                <IconButton size="small" onClick={doPaste}>
                  <AssignmentIcon />
                </IconButton>
              )}
            </Box>
          </ListSubheader>
          <Grid className={classes.slotListContainer} container spacing={1}>
            {slotsList.map((slot) => (
              <Grid
                key={slot.id}
                className={
                  canClickSlots ? classes.clickable : classes.unclickable
                }
                onClick={() =>
                  canClickSlots &&
                  (checkSelected(slot.id)
                    ? dispatch(deleteSlotFromClipboard(slot.id))
                    : dispatch(addSlotToClipboard(slot)))
                }
                item
                xs={12}
                md={6}
                lg={!isCustomer ? 3 : 4}
                xl={!isCustomer ? 2 : 3}
              >
                <Slot
                  selected={checkSelected(slot.id)}
                  data={slot}
                  key={slot.id}
                  deleted={Boolean(deletedSlots[slot.id])}
                  onDelete={extendedOnDelete}
                  {...{
                    ...(enableEdit && { setCreateEditDialog }),
                    ...(canChange && { onSubscribe, onUnsubscribe }),
                    subscribedSlots,
                  }}
                ></Slot>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Grid className={classes.bookingsListContainer} container spacing={3}>
          {slotsList.map(
            (slot) =>
              subscribedSlots &&
              subscribedSlots[slot.id] && (
                <Grid key={slot.id} item xs={12} sm={6} md={4} lg={3}>
                  <CustomerAreaBookingCard
                    data={subscribedSlots[slot.id]}
                    key={slot.id}
                  />
                </Grid>
              )
          )}
        </Grid>
      )}
    </>
  );
};

export default SlotsDay;

const useStyles = makeStyles((theme: ETheme) => ({
  listSubheader: {
    fontVariant: "small-caps",
    backgroundColor: theme.palette.background.default,

    display: "flex",
  },
  slotListContainer: {
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
    borderBottomStyle: "solid",
    borderBottomColor: theme.palette.divider,
    borderBottomWidth: 1,
  },
  bookingsListContainer: {
    marginTop: theme.spacing(0.5),
    justifyContent: "center",
  },
  date: {
    "flex-grow": 1,
    color: theme.palette.getContrastText(theme.palette.background.default),
  },
  dateButtons: {
    "flex-grow": 0,
  },
  clickable: {
    cursor: "pointer",
  },
  unclickable: {
    cursor: "auto",
  },
}));
