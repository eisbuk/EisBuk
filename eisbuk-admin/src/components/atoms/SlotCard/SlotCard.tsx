import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import CardActions from "@material-ui/core/CardActions";
import Box from "@material-ui/core/Box";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Duration, Slot as SlotInterface } from "eisbuk-shared";

import { SlotView } from "@/enums/components";

import DurationsSection from "./DurationsSection";
import SlotOperationButtons from "./SlotOperationButtons";
import SlotTime from "./SlotTime";
import SlotTypeLabel from "./SlotTypeLabel";

import { fb2Luxon } from "@/utils/date";

export interface SlotCardProps extends SlotInterface<"id"> {
  /**
   * Controls slot displaying different color when being selected
   */
  selected?: boolean;
  /**
   * Duration, on this particular slot, for which the user has subscribed
   */
  subscribedDuration?: Duration;
  /**
   * Display different parts and enable different actions with respect to the view ("admin"/"customer")
   */
  view?: SlotView;
  /**
   * Enable edit/delete of the slot in admin view
   */
  enableEdit?: boolean;
}

// ***** Region Component Function ***** //
/**
 * Atomic component used to render slot data to the UI. Displayed content can vary according to `view` prop:
 * - "customer" - shows customer view: durations are clickable and trigger subscription to slot (with appropriate message)
 * - "admin" - shows all of the athlete categories for slot (hidden in "customer" view). Additionally, if `enableEdit` prop is `true`, admin can perform edit operations on the slot (edit, delete)
 */
const SlotCard: React.FC<SlotCardProps> = ({
  selected,
  subscribedDuration,
  view = SlotView.Customer,
  enableEdit,
  ...slotData
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const date = fb2Luxon(slotData.date);

  const isSubscribed = Boolean(subscribedDuration);

  return (
    <>
      <Card
        className={clsx(classes.root, { [classes.selected]: selected })}
        raised={isSubscribed}
        variant="outlined"
      >
        <CardContent className={classes.wrapper}>
          <SlotTime startTime={date} subscribedDuration={subscribedDuration} />
          <Box
            display="flex"
            flexGrow={1}
            justifyContent="space-between"
            flexDirection="column"
          >
            {view === SlotView.Admin && (
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
            )}
            <Box pl={1} pb={1} className={classes.notes}>
              {slotData.notes}
            </Box>
          </Box>
        </CardContent>
        <CardActions className={classes.actionsContainer} disableSpacing={true}>
          <Box display="flex" flexGrow={1}>
            {/* <DurationsSection
              {...slotData}
              enableSubscription={view === SlotView.Customer}
              subscribedDuration={subscribedDuration}
            /> */}
            <SlotTypeLabel slotType={slotData.type} />
            {view === SlotView.Admin && enableEdit && (
              <SlotOperationButtons {...slotData} />
            )}
          </Box>
        </CardActions>
      </Card>
    </>
  );
};
// ***** Region Component Function ***** //

// ***** Region Styles ***** //
const useStyles = makeStyles((theme) => ({
  root: {
    border: "1px solid",
    borderColor: theme.palette.divider,
    position: "relative",
    "&.MuiPaper-elevation8": {
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: theme.palette.primary.main,
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
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: theme.palette.divider,
    padding: 0,
  },
  "&.MuiPaper-elevation8": {
    border: "2px solid red",
  },
  selected: {
    backgroundColor: theme.palette.warning.light,
  },
}));
// ***** End Region Styles ***** //

export default SlotCard;
