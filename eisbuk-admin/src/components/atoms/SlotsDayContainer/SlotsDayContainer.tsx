import React from "react";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";

import ListSubheader from "@material-ui/core/ListSubheader";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotView } from "@/enums/components";

import { luxon2ISODate } from "@/utils/date";

interface Props {
  /**
   * Boolean flag to show additional buttons (if not specified, will default to `true`)
   */
  showAdditionalButtons?: boolean;
  /**
   * Aditional buttons to show, if not specified, will default to `null`
   */
  additionalButtons?: JSX.Element | null;
  /**
   * Luxon day to use as title
   */
  date: DateTime;
  /**
   *
   */
  view?: SlotView;
}

/**
 * Container used to hold slots day.
 * Displays the list subheader (containing date) and slots,
 * passed as chidren for better readability in caller component
 * @param param0
 * @returns
 */
const SlotsDayContainer: React.FC<Props> = ({
  date,
  additionalButtons = null,
  showAdditionalButtons = true,
  children,
  view = SlotView.Admin,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const dateISO = luxon2ISODate(date);

  return (
    <>
      <ListSubheader className={classes.listSubheader}>
        <Typography display="inline" variant="h4" className={classes.date}>
          {t("SlotsDay.Date", { date })}
        </Typography>
        {showAdditionalButtons && additionalButtons}
      </ListSubheader>
      <Grid className={classes.slotListContainer} container spacing={1}>
        {children instanceof Array
          ? children.map((child, i, { length }) => (
              <Grid
                key={`${dateISO}-${length}-${i}`}
                item
                xs={12}
                md={6}
                lg={view === SlotView.Admin ? 3 : 4}
                xl={view === SlotView.Admin ? 2 : 3}
              >
                {child}
              </Grid>
            ))
          : children}
        {/* {slotsList.map((slot) => (
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
        ))} */}
      </Grid>
    </>
  );
};

// #region styles
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
// #endregion styles

export default SlotsDayContainer;
