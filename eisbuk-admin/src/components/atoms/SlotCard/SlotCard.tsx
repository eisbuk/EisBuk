import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { DateTime } from "luxon";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterface, SlotInterval } from "eisbuk-shared";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  EditSlotButton,
  DeleteButton,
} from "@/components/atoms/SlotOperationButtons";
import SlotTime from "./SlotTime";
import SlotTypeLabel from "./SlotTypeLabel";

import { fb2Luxon } from "@/utils/date";

import { __slotId__ } from "./__testData__/testIds";

export interface SlotCardProps extends SlotInterface {
  /**
   * Controls slot displaying different color when being selected
   */
  selected?: boolean;
  /**
   * Enable edit/delete of the slot in admin view
   */
  enableEdit?: boolean;
  /**
   * Click handler for the entire card, will default to empty function if none is provided
   */
  onClick?: (e: React.SyntheticEvent) => void;
}

// #region componentFunction
/**
 * Atomic component used to render slot data to the UI. Displayed content can vary according to `view` prop:
 * - "customer" - shows customer view: durations are clickable and trigger subscription to slot (with appropriate message)
 * - "admin" - shows all of the athlete categories for slot (hidden in "customer" view). Additionally, if `enableEdit` prop is `true`, admin can perform edit operations on the slot (edit, delete)
 */
const SlotCard: React.FC<SlotCardProps> = ({
  selected,
  enableEdit,
  onClick,
  ...slotData
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const date = fb2Luxon(slotData.date);

  const canClick = Boolean(onClick);

  const intervalStrings = Object.keys(slotData.intervals || {});

  // calculate start time of first interval and end time of last interval
  // for title string rendering
  const intervalValues = Object.values(slotData.intervals || {});
  const { startTime, endTime }: SlotInterval = intervalStrings.reduce(
    (acc, intKey) => {
      const { startTime, endTime } = slotData.intervals[intKey];

      return {
        startTime: startTime < acc.startTime ? startTime : acc.startTime,
        endTime: endTime > acc.endTime ? endTime : acc.endTime,
      };
    },
    intervalValues[0] || { startTime: "00:00", endTime: "00:00" }
  );

  return (
    <>
      <Card
        className={clsx(classes.root, {
          [classes.selected]: selected,
          [classes.cursorPointer]: canClick,
        })}
        variant="outlined"
        data-testid={__slotId__}
        onClick={onClick}
      >
        <CardContent className={classes.wrapper}>
          <SlotTime {...{ startTime, endTime }} />
          <Box
            display="flex"
            flexGrow={1}
            justifyContent="space-between"
            flexDirection="column"
          >
            <Box className={classes.categories} display="flex">
              {slotData.categories.map((category) => (
                <Typography
                  className={classes.category}
                  color="textSecondary"
                  key={category}
                >
                  {t(`Categories.${category}`)}
                </Typography>
              ))}
            </Box>
            <Box pl={1} pb={1} className={classes.notes}>
              {slotData.notes}
            </Box>
          </Box>
        </CardContent>
        <Box className={classes.actionsContainer} flexGrow={1}>
          <SlotTypeLabel slotType={slotData.type} />
          <Box display="flex" justifyContent="space-evenly">
            {intervalStrings.map((interval) => (
              <Typography
                key={interval}
                component="span"
                variant="body2"
                className={classes.intervalTag}
              >
                {interval.split("-").join(" - ")}
              </Typography>
            ))}
          </Box>
          {enableEdit && (
            <SlotOperationButtons
              contextType={ButtonContextType.Slot}
              slot={slotData}
              iconSize="small"
              className={classes.buttons}
            >
              <EditSlotButton />
              <DeleteButton confirmDialog={createDeleteConfirmDialog(date)} />
            </SlotOperationButtons>
          )}
        </Box>
      </Card>
    </>
  );
};
// #endregion componentFunction

// #region localUtils
/**
 * Creates a confirm dialog for `DeleteButton` on slot.
 * Uses i18n translations of delete confirmation propmt and returns
 * everything as `{title, description}` object
 * @param date date of slot to delete
 * @returns `confirmDialog` object for `DeleteButton`
 */
const createDeleteConfirmDialog = (date: DateTime) => {
  // get delete prompt translation
  const deletePrompt = i18n.t("Slots.DeleteConfirmation");
  // get date localization
  const confirmDialogDate = i18n.t("Slots.ConfirmDialogDate", {
    date,
  });
  // get time-of-day localization
  const confirmDialogTime = i18n.t("Slots.ConfirmDialogTime", { date });
  // get translation for word "slot"
  const slotTranslation = i18n.t("Slots.Slot");

  // join title parts into one string
  const title = [
    deletePrompt,
    confirmDialogDate,
    confirmDialogTime,
    slotTranslation,
  ].join(" ");

  // get translated non-reversible-action message
  const description = i18n.t("Slots.NonReversible");
  return { title, description };
};
// #endregion localUtils

// #region styles
const useStyles = makeStyles((theme) => ({
  root: {
    border: "1px solid",
    borderColor: theme.palette.divider,
    position: "relative",
    "&.MuiPaper-elevation8": {
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: theme.palette.primary.light,
    },
  },
  wrapper: {
    display: "flex",
    padding: 0,
    "&:last-child": {
      paddingBottom: 0,
    },
  },
  categories: {
    padding: 4,
  },
  category: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  notes: { fontWeight: theme.typography.fontWeightLight },
  actionsContainer: {
    display: "flex",
    justifyContent: "start",
    alignItems: "center",
    height: "2.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: theme.palette.divider,
    padding: "0 0.5rem",
  },
  intervalTag: {
    margin: "0.25rem",
    background: theme.palette.primary.main,
    padding: "0.25rem 0.5rem",
    borderRadius: "0.5rem",
    overflow: "hidden",
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
    fontSize: "0.75rem",
  },
  buttons: {
    marginLeft: "auto",
  },
  selected: {
    backgroundColor: theme.palette.warning.light,
  },
  cursorPointer: {
    cursor: "pointer",
  },
}));
// #endregion styles

export default SlotCard;
