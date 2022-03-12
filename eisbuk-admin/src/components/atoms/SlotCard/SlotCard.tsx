import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import { SlotInterface, SlotInterval, fromISO } from "eisbuk-shared";

import { Prompt, DateFormat, CategoryLabel } from "@/enums/translations";
import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  EditSlotButton,
  DeleteButton,
} from "@/components/atoms/SlotOperationButtons";
import SlotTime from "./SlotTime";
import SlotTypeIcon from "@/components/atoms/SlotTypeIcon";

import { comparePeriods } from "@/utils/helpers";
import { getColorForSlotType } from "@/utils/theme";

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

  const canClick = Boolean(onClick);

  const intervalStrings = Object.keys(slotData.intervals || {}).sort(
    comparePeriods
  );

  // color used to paint slot card with respect to type
  const typeColor = getColorForSlotType(slotData.type);

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
          <SlotTime backgroundColor={typeColor} {...{ startTime, endTime }} />
          <Box
            display="flex"
            flexGrow={1}
            justifyContent="space-between"
            flexDirection="column"
          >
            <Box className={classes.categories} display="flex">
              {slotData.categories.map((category) => (
                <Typography
                  style={{
                    backgroundColor: getColorForSlotType(slotData.type),
                  }}
                  className={classes.category}
                  color="textSecondary"
                  key={category}
                >
                  {t(CategoryLabel[category])}
                </Typography>
              ))}
            </Box>
            <Box pl={1} pb={1} className={classes.notes}>
              {slotData.notes}
            </Box>
          </Box>
        </CardContent>
        <Box className={classes.actionsContainer} flexGrow={1}>
          <SlotTypeIcon className={classes.typeLabel} type={slotData.type} />
          <Box display="flex" justifyContent="space-evenly">
            {intervalStrings.map((interval) => (
              <Typography
                style={{ backgroundColor: typeColor }}
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
              <DeleteButton
                confirmDialog={createDeleteConfirmDialog({
                  date: slotData.date,
                  startTime,
                  endTime,
                })}
              />
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
const createDeleteConfirmDialog = ({
  date: isoDate,
  startTime,
  endTime,
}: {
  date: string;
  startTime: string;
  endTime: string;
}) => {
  // get luxon date (for i18n function)
  const date = fromISO(isoDate);
  // get delete prompt translation
  const deletePrompt = i18n.t(Prompt.DeleteSlot);
  // get date localization
  const confirmDialogDate = i18n.t(DateFormat.DayMonth, {
    date,
  });
  // get time span localization
  const startTimeString = i18n.t(DateFormat.Time, {
    date: fromISO(startTime),
  });
  const endTimeString = i18n.t(DateFormat.Time, {
    date: fromISO(endTime),
  });
  const confirmDialogTimespan = `(${startTimeString}-${endTimeString})`;

  // join title parts into one string
  const title = [
    deletePrompt,
    confirmDialogDate,
    confirmDialogTimespan,
    "slot",
  ].join(" ");

  // get translated non-reversible-action message
  const description = i18n.t(Prompt.NonReversible);
  return { title, description };
};
// #endregion localUtils

// #region styles
const useStyles = makeStyles((theme) =>
  createStyles({
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
      display: "flex",
      flexWrap: "wrap",
    },
    typeLabel: {
      padding: `0 ${theme.spacing(1)}`,
    },
    category: {
      textTransform: "uppercase",
      whitespace: "nowrap",
      border: "none",
      borderRadius: 8,
      fontWeight: theme.typography.fontWeightBold,
      fontSize: theme.typography.pxToRem(10),
      margin: `${theme.spacing(0.5)} ${theme.spacing(0.5)}`,
      padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
    },
    notes: {
      fontWeight: theme.typography.fontWeightBold,
    },
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
  })
);
// #endregion styles

export default SlotCard;
