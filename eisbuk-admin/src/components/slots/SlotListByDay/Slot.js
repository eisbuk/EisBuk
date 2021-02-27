import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  ButtonGroup,
  IconButton,
  Card,
  CardContent,
  Typography,
  CardActions,
  Box,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Delete as DeleteIcon, Create as CreateIcon } from "@material-ui/icons";
import { FBToLuxon } from "../../../data/dtutils";
import ConfirmDialog from "../../global/ConfirmDialog";
import { slotsLabels } from "../../../config/appConfig";

export default ({
  data,
  onDelete,
  deleted,
  onSubscribe,
  onUnsubscribe,
  subscribedSlots,
}) => {
  const classes = useStyles();
  const date = FBToLuxon(data.date);
  subscribedSlots = subscribedSlots || {};
  const doDelete = onDelete ? () => onDelete(data.id) : onDelete;
  const showSubscribe = Boolean(onUnsubscribe && onSubscribe);
  const isSubscribed = Boolean(subscribedSlots[data.id]);
  const subscribedDuration = isSubscribed && subscribedSlots[data.id].duration;
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const auth = useSelector((state) => state.firebase.auth);

  const handleSubscription = (duration) => (evt) => {
    if (isSubscribed) {
      if (subscribedDuration === duration) {
        onUnsubscribe(data);
      } else {
        onUnsubscribe(data);
        onSubscribe({ ...data, duration });
      }
    } else {
      onSubscribe({ ...data, duration });
    }
  };
  return (
    <>
      {!deleted && (
        <Card className={classes.root} raised={isSubscribed} variant="outlined">
          <CardContent className={classes.wrapper}>
            <Box p={1} flexShrink={0} className={classes.slotTime}>
              <Typography
                key="start"
                display="inline"
                variant="h5"
                component="h2"
              >
                {date.toISOTime().substring(0, 5)}
              </Typography>
              {isSubscribed && (
                <Typography
                  key="end"
                  display="inline"
                  variant="h6"
                  component="h3"
                  className={classes.endTime}
                >
                  {" "}
                  -{" "}
                  {date
                    .plus({ minutes: subscribedDuration })
                    .minus({ minutes: 10 })
                    .toISOTime()
                    .substring(0, 5)}
                </Typography>
              )}
            </Box>
            <Box
              display="flex"
              flexGrow={1}
              justifyContent="space-between"
              flexDirection="column"
            >
              {data.categories && // Safety check. Can be removed when migrateSlotsToPluralCategories has been applied
                auth &&
                !auth.isEmpty &&
                auth.isLoaded && (
                  <Box display="flex" display="flex">
                    {data.categories.map((category) => (
                      <Typography
                        className={classes.category}
                        color="textSecondary"
                        key={category}
                      >
                        {category}
                      </Typography>
                    ))}
                  </Box>
                )}
              <Box pl={1} pb={1} className={classes.notes}>
                {data.notes}
              </Box>
            </Box>
          </CardContent>
          <CardActions
            className={classes.actionsContainer}
            disableSpacing={true}
          >
            <Box display="flex" flexGrow={1}>
              <Box flexGrow={1}>
                {data.durations && (
                  <ButtonGroup variant="text">
                    {data.durations.map((duration) => {
                      const color =
                        subscribedDuration === duration
                          ? "primary"
                          : showSubscribe
                          ? "secondary"
                          : undefined;

                      if (showSubscribe) {
                        return (
                          <Button
                            key={duration}
                            color={color}
                            onClick={handleSubscription(duration)}
                            className={classes.duration}
                          >
                            {slotsLabels.durations[duration].label}
                          </Button>
                        );
                      }
                      return (
                        <Button
                          className={classes.duration}
                          key={duration}
                          color={color}
                          disabled
                        >
                          {slotsLabels.durations[duration].label}
                        </Button>
                      );
                    })}
                  </ButtonGroup>
                )}
              </Box>
              {doDelete
                ? doDelete &&
                  !deleted && (
                    <Box display="flex" alignItems="center">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => setConfirmDeleteDialog(true)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => alert("Edit UI TBD")}
                        size="small"
                      >
                        <CreateIcon />
                      </IconButton>
                    </Box>
                  )
                : null}
            </Box>
          </CardActions>
        </Card>
      )}
      {confirmDeleteDialog ? (
        <ConfirmDialog
          title={`Sei sicuro di voler rimuovere lo slot del ${date.toFormat(
            "d MMMM",
            { locale: "it-IT" }
          )} alle ${date.toFormat("HH:mm")}?`}
          open={confirmDeleteDialog}
          setOpen={setConfirmDeleteDialog}
          onConfirm={doDelete}
        >
          Questa azione non è reversibile
        </ConfirmDialog>
      ) : null}
    </>
  );
};

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
  slotTime: {
    borderRightWidth: 1,
    borderRightColor: theme.palette.divider,
    borderRightStyle: "solid",
  },
  category: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  notes: { fontWeight: theme.typography.fontWeightLight },
  type: {
    textTransform: "uppercase",
  },
  duration: {
    "&.MuiButton-root.Mui-disabled.MuiButton-textPrimary": {
      color: theme.palette.primary.main,
    },
    borderColor: theme.palette.divider,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: theme.palette.divider,
    padding: 0,
  },
  endTime: {},
  "&.MuiPaper-elevation8": {
    border: "2px solid red",
  },
}));
