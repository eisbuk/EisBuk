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
import {
  FileCopy as FileCopyIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Assignment as AssignmentIcon,
} from "@material-ui/icons";
import Slot from "./Slot";
import {
  copySlotDay,
  createSlots,
  deleteSlotFromClipboard,
  addSlotToClipboard,
} from "../../../store/actions/actions";
import { calendarDaySelector } from "../../../store/selectors";
import { shiftSlotsDay } from "../../../data/slotutils";
import LuxonUtils from "@date-io/luxon";
import { DateTime } from "luxon";
import CustomerAreaBookingCard from "../../customerArea/CustomerAreaBookingCard";
import _ from "lodash";

const luxon = new LuxonUtils({ locale: "C" });

const dayCopyPasteSelector = (state) => state.copyPaste.day ?? {};

const SlotsDay = ({
  day,
  slots,
  onSubscribe,
  onUnsubscribe,
  subscribedSlots,
  onDelete,
  enableEdit,
  view = "slots",
  isCustomer,
  setCreateEditDialog,
}) => {
  subscribedSlots = subscribedSlots || {};
  const [deletedSlots, setDeletedSlots] = useState({});
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.firebase.auth);
  const currentWeek = useSelector(calendarDaySelector).startOf("week");
  const luxonDay = luxon.parse(day, "yyyy-LL-dd");
  const dateStr = luxonDay.toFormat("EEEE d MMMM", { locale: "it-IT" });
  const copiedWeek = useSelector((state) => state.copyPaste.week) || {};
  const copiedWeekSlots = copiedWeek.slots
    ? copiedWeek.slots.map((slot) => slot.id)
    : [];

  const checkSelected = (id) => copiedWeekSlots.includes(id);
  const canClickSlots =
    enableEdit &&
    copiedWeekSlots.length > 0 &&
    copiedWeek.weekStart.equals(currentWeek);
  const extendedOnDelete =
    onDelete && enableEdit
      ? (slot) => {
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
      <IconButton variant="outlined" size="small" onClick={showCreateForm}>
        <AddCircleOutlineIcon />
      </IconButton>
    </>
  );

  const canChange =
    (isLoaded(auth) && !isEmpty(auth)) ||
    luxonDay - DateTime.local().endOf("month") > 0;
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
                  variant="outlined"
                  size="small"
                  onClick={() => dispatch(copySlotDay(slots))}
                >
                  <FileCopyIcon />
                </IconButton>
              )}
              {enableEdit && Object.keys(dayInClipboard).length > 0 && (
                <IconButton variant="outlined" size="small" onClick={doPaste}>
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
                  deleted={!!deletedSlots[slot.id]}
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
              Boolean(subscribedSlots[slot.id]) && (
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

const useStyles = makeStyles((theme) => ({
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
