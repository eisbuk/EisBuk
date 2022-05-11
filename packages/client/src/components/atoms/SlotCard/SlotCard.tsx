import React from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import { SlotInterface, SlotInterval, fromISO } from "@eisbuk/shared";
import i18n, {
  useTranslation,
  Prompt,
  DateFormat,
  CategoryLabel,
} from "@eisbuk/translations";

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

  const backgroundColor = selected ? classes.bgSelected : classes.bgBasic;

  // Set up container styles
  const containerClasses = [
    classes.container,
    backgroundColor,
    ...(canClick ? [classes.cursorPointer] : []),
  ].join(" ");

  // Set up slot type label styles
  const slotTypeLabelClasses = [classes.typeLabel, backgroundColor].join(" ");

  // Set up interval styles
  const overlayShadow = selected ? classes.insetSelected : classes.insetBasic;
  const intervalsOverlayClasses = [classes.overlay, overlayShadow].join(" ");

  // Set up action button styles
  const actionButtonClasses = [classes.actionButtons, backgroundColor].join(
    " "
  );

  return (
    <>
      <Card
        className={containerClasses}
        variant="outlined"
        data-testid={__slotId__}
        onClick={onClick}
      >
        <CardContent className={classes.contentTop}>
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

        <Box className={classes.contentBottom} flexGrow={1}>
          <SlotTypeIcon className={slotTypeLabelClasses} type={slotData.type} />
          <Box className={classes.intervalsContainer}>
            <>
              <div className={intervalsOverlayClasses} />
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
            </>
          </Box>
          {enableEdit && (
            <SlotOperationButtons
              contextType={ButtonContextType.Slot}
              slot={slotData}
              iconSize="small"
              className={actionButtonClasses}
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
    // Blocks top
    container: {
      border: "1px solid",
      borderColor: theme.palette.divider,
      position: "relative",
      "&.MuiPaper-elevation8": {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.palette.primary.light,
      },
    },
    contentTop: {
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

    // Blocks bottom
    contentBottom: {
      display: "flex",
      flexWrap: "nowrap",
      justifyContent: "start",
      alignItems: "center",
      height: "2.25rem",
      borderTopWidth: 1,
      borderTopStyle: "solid",
      borderTopColor: theme.palette.divider,
      padding: "0 0.5rem",
    },
    typeLabel: {
      height: "100%",
      backgroundColor: "inherit",
      padding: `0 ${theme.spacing(1)}`,
    },
    intervalsContainer: {
      position: "relative",
      height: "100%",
      overflow: "hidden",
      padding: ".5rem",
      boxSizing: "border-box",
    },
    intervalTag: {
      margin: "0 0.25rem",
      padding: "0.25rem 0.5rem",
      borderRadius: "0.5rem",
      overflow: "hidden",
      color: theme.palette.primary.contrastText,
      fontWeight: "bold",
      fontSize: "0.75rem",
      whiteSpace: "nowrap",
    },
    actionButtons: {
      height: "100%",
      marginLeft: "auto",
      backgroundColor: "inherit",
    },

    // Color
    bgSelected: {
      backgroundColor: theme.palette.warning.light,
    },
    bgBasic: {
      backgroundColor: "#FFFFFF",
    },
    insetSelected: {
      boxShadow: `inset 12px 0 6px -6px ${theme.palette.warning.light}, inset -12px 0 6px -6px ${theme.palette.warning.light}`,
    },
    insetBasic: {
      boxShadow:
        "inset 12px 0 6px -6px #FFFFFF, inset -12px 0 6px -6px #FFFFFF",
    },

    // Misc utils
    cursorPointer: {
      cursor: "pointer",
    },
    overlay: {
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
  })
);
// #endregion styles

export default SlotCard;
