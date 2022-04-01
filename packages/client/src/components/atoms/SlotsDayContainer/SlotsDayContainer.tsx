import React from "react";
import { DateTime } from "luxon";

import ListSubheader from "@mui/material/ListSubheader";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import { getIsBookingAllowed } from "@/store/selectors/bookings";
import { useSelector } from "react-redux";

/**
 * Wrapper function we're using to wrap each child element (for styling).
 * We're using this in case some of the children components render an array of elements
 * inside of `React.Fragment` (`BookingCardGroup`), thus making it difficult to iterate over said elements,
 * so this way each child component can apply wrapper to elements in a way native to that component.
 */
type ElementWrapper = React.FC;

/**
 * A render function we're accepting as `children` and passing the element wrapper to.
 */
interface RenderFunction {
  (params: { WrapElement: ElementWrapper; lockBookings: boolean }): JSX.Element;
}

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
   * We're using this component as a render prop, in order to be able to pass
   * wrapper component for each element (MUI `<Grid />`) to a render function.
   * The render function is accepted as children prop.
   */
  children?: RenderFunction;
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
  children: render = () => <></>,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  // used only for /customer_area
  // let the render prop function know if bookings for a day should be disabled
  const lockBookings = !useSelector(getIsBookingAllowed(date));

  const WrapElement: ElementWrapper = ({ children }) => (
    <Grid item xs={12} md={6} lg={4} xl={3}>
      {children}
    </Grid>
  );

  return (
    <>
      <ListSubheader className={classes.listSubheader}>
        <Typography display="inline" variant="h4" className={classes.date}>
          {t(DateFormat.Full, { date })}
        </Typography>
        {showAdditionalButtons && additionalButtons}
      </ListSubheader>
      <Grid className={classes.slotListContainer} container spacing={1}>
        {render({ WrapElement, lockBookings })}
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
    minHeight: "10rem",
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