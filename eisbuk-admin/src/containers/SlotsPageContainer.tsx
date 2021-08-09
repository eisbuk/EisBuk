import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import Badge from "@material-ui/core/Badge";
import Container from "@material-ui/core/Container";
import IconButton from "@material-ui/core/IconButton";
import Switch from "@material-ui/core/Switch";

import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import AssignmentIcon from "@material-ui/icons/Assignment";

import makeStyles from "@material-ui/core/styles/makeStyles";

import _ from "lodash";

import DateNavigationAppBar from "@/containers/DateNavigationAppBar";
import SlotListByDay, { SlotListProps } from "@/components/slots/SlotListByDay";
import ConfirmDialog from "@/components/global/ConfirmDialog";

import { shiftSlotsWeek } from "@/utils/slots";

import { ETheme } from "@/themes";

import { createSlots, deleteSlots } from "@/store/actions/slotOperations";
import { copySlotWeek } from "@/store/actions/copyPaste";

import { getCurrentWeekStart } from "@/store/selectors/app";
import { getWeekFromClipboard } from "@/store/selectors/copyPaste";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {},
  slotlist: {
    "& > li.MuiListSubheader-sticky": {
      top: theme.mixins.toolbar.minHeight,
    },
  },
}));

type Props = Omit<Omit<SlotListProps, "enableEdit">, "className">;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SlotsPageContainer: React.FC<Props> = ({ slots, children, ...props }) => {
  const classes = useStyles();

  const [enableEdit, setEnableEdit] = useState(false);
  const [showWeekDeleteConfirm, setShowWeekDeleteConfirm] = useState(false);

  const currentDate = useSelector(getCurrentWeekStart);
  const weekToPaste = useSelector(getWeekFromClipboard);

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
      dispatch(createSlots(shiftSlotsWeek(weekToPaste.slots, currentDate)));
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
