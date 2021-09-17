import React from "react";

import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Duration, Slot as SlotInterface } from "eisbuk-shared";

import SlotTime from "./SlotTime";

import { SlotView } from "@/enums/components";
import SlotTypeLabel from "./SlotTypeLabel";
import { SlotInterval } from "@/types/temp";

// export type Props = Pick<Slot, "type"> & { view?: SlotView } & Pick<
//     Slot,
//     "date"
//   > &
//   Pick<Slot, "notes"> & {
//     bookedDuration: Duration;
//   };
export interface BookingCardProps extends SlotInterface<"id"> {
  /**
   * Controls slot displaying different color when being selected
   */
  selected?: boolean;
  /**
   * Duration, on this particular slot, for which the user has subscribed
   */
  subscribedDuration?: Duration;
  /**
   * Interval (one of the available intervals for this slot)
   */

  interval: SlotInterval;
  /**
   * Display different parts and enable different actions with respect to the view ("admin"/"customer")
   */
  view?: SlotView;
  /**
   * Click handler for the entire card, will default to empty function if none is provided
   */
  onClick?: (e: React.SyntheticEvent) => void;
}

/** @TODO This component needs fixing (rebase), would be best to do if we implement tailwind */
const BookingCard: React.FC<BookingCardProps> = ({
  subscribedDuration,
  view = SlotView.Calendar,
  ...slotData
}) => {
  const classes = useStyles();

  // const { t } = useTranslation();
  // const slotLabel = slotsLabels.types[slotData.type];

  return (
    <Card variant="outlined" className={classes.root}>
      <CardContent className={classes.content}>
        <SlotTime
          interval={slotData.interval}
          disabled={view === SlotView.Calendar}
        />

        <Box display="flex" flexGrow={1} flexDirection="column">
          <Box display="flex" flexGrow={1} className={classes.topWrapper}>
            {slotData.notes && (
              <Box
                display="flex"
                className={classes.notesWrapper}
                alignItems="center"
              >
                <Typography className={classes.notes}>
                  {slotData.notes}
                </Typography>
              </Box>
            )}
          </Box>
          <Box display="flex">
            <Box
              display="flex"
              justifyContent="center"
              flexGrow={1}
              className={classes.durationWrapper}
            >
              <SlotTypeLabel slotType={slotData.type} />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ***** Region Styles ***** //
// type Theme = typeof currentTheme;

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  content: {
    display: "flex",
    flexDirection: "row",
    padding: 0,
    "&:last-child": {
      // Fix for Material-UI defaulting this to 24
      paddingBottom: 0,
    },
  },
  date: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    padding: theme.spacing(1),
    "& .MuiTypography-root:not(.makeStyles-weekday-20)": {
      lineHeight: 1,
    },
  },
  topWrapper: { borderBottom: `1px solid ${theme.palette.divider}` },
  time: {
    padding: theme.spacing(1.5),
  },
  notesWrapper: {
    borderLeft: `1px solid ${theme.palette.divider}`,
    paddingLeft: theme.spacing(1),
  },
  notes: {
    fontWeight: theme.typography.fontWeightLight,
  },
  endTime: {
    color: theme.palette.grey[700],
  },
  typeIcon: {
    opacity: 0.5,
  },
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
  durationWrapper: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  duration: {},
  weekday: {
    textTransform: "uppercase",
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightBold,
  },
  day: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.fontWeightLight,
  },
  month: {
    textTransform: "uppercase",
    fontSize: theme.typography.pxToRem(13),
    fontWeight: theme.typography.fontWeightBold,
  },
  deleteButton: {},
  slotTime: {
    borderRightWidth: 1,
    borderRightColor: theme.palette.divider,
    borderRightStyle: "solid",
  },
}));
// ***** End Region Styles ***** //

export default BookingCard;
