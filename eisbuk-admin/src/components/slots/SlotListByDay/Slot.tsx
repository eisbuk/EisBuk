import React, { useState } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
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
import { useTranslation } from "react-i18next";
import {
  Delete as DeleteIcon,
  Create as CreateIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from "@material-ui/icons";

import { Duration, Slot as SlotInterface, BookingInfo } from "eisbuk-shared";

import { LocalStore } from "@/types/store";
import { SlotOperation } from "@/types/slotOperations";

import ConfirmDialog from "@/components/global/ConfirmDialog";
import ProjectIcon from "@/components/global/ProjectIcons";

import { fb2Luxon } from "@/data/dtutils";

import { slotsLabels } from "@/config/appConfig";

type SetCreateEditDialog = React.Dispatch<
  React.SetStateAction<
    Partial<{
      isOpen: boolean;
      day: string | null;
      slotToEdit: SlotInterface<"id"> | null;
    }>
  >
>;

export interface SlotProps {
  data: SlotInterface<"id">;
  onDelete?: SlotOperation;
  deleted: boolean;
  selected?: boolean;
  onSubscribe?: SlotOperation;
  onUnsubscribe?: SlotOperation;
  subscribedSlots?: Record<string, BookingInfo>;
  setCreateEditDialog?: SetCreateEditDialog;
}

const Slot: React.FC<SlotProps> = ({
  data,
  onDelete,
  deleted,
  selected,
  onSubscribe,
  onUnsubscribe,
  subscribedSlots = {},
  setCreateEditDialog = () => {},
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const date = fb2Luxon(data.date);

  const showSubscribe = Boolean(onUnsubscribe && onSubscribe);
  const isSubscribed = Boolean(subscribedSlots[data.id]);

  const subscribedDuration = isSubscribed
    ? subscribedSlots[data.id].duration
    : undefined;

  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);

  /** @TODO rewrite this to use imported selector */
  const auth = useSelector((state: LocalStore) => state.firebase.auth);

  const slotLabel = slotsLabels.types[data.type];

  /**
   *
   * @param duration
   * @returns
   */
  const handleSubscription = (duration: Duration) => () => {
    if (isSubscribed) {
      if (subscribedDuration === duration) {
        onUnsubscribe!(data);
      } else {
        onSubscribe!({ ...data, duration });
      }
    } else {
      onSubscribe!({ ...data, duration });
    }
  };

  return (
    <>
      {!deleted && (
        <Card
          className={clsx(classes.root, { [classes.selected]: selected })}
          raised={isSubscribed}
          variant="outlined"
        >
          <CardContent className={classes.wrapper}>
            <Box p={1} flexShrink={0} className={classes.slotTime}>
              <Typography
                key="start"
                display="inline"
                variant="h5"
                component="h2"
                color={isSubscribed ? "primary" : "initial"}
              >
                <strong>{date.toISOTime().substring(0, 5)}</strong>
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
                    .plus({ minutes: Number(subscribedDuration) })
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
                  <Box display="flex">
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
              <Box flexGrow={1} display="flex" alignItems="center">
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
                {showSubscribe && !isSubscribed && (
                  <>
                    <ArrowBackIcon fontSize="small" />
                    <Typography className={classes.helpText}>
                      {t("Slots.Book")}
                    </Typography>
                  </>
                )}
                {isSubscribed && (
                  <>
                    <CheckCircleIcon color="primary" fontSize="small" />
                    <Typography className={classes.helpText}>
                      Prenotato
                    </Typography>
                  </>
                )}
              </Box>
              <Box display="flex" alignItems="center" pl={1} pr={1}>
                <ProjectIcon
                  className={classes.typeIcon}
                  icon={slotLabel.icon}
                  fontSize="small"
                />
                <Typography
                  className={classes.type}
                  key="type"
                  color={slotLabel.color}
                >
                  {t(`Types.${slotLabel.label}`)}
                </Typography>
              </Box>
              {Boolean(onDelete) && !deleted ? (
                <Box display="flex" alignItems="center" mr={1}>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() =>
                      setCreateEditDialog({
                        isOpen: true,
                        slotToEdit: data,
                      })
                    }
                    size="small"
                  >
                    <CreateIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => setConfirmDeleteDialog(true)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ) : null}
            </Box>
          </CardActions>
        </Card>
      )}
      {confirmDeleteDialog && Boolean(onDelete) && (
        <ConfirmDialog
          title={`${t(
            "Slots.DeleteConfirmation"
          )} ${t("Slots.ConfirmDialogDate", { date })}
          ${t("Slots.ConfirmDialogTime", { date })} ${t("Slots.Slot")}?`}
          open={confirmDeleteDialog}
          setOpen={setConfirmDeleteDialog}
          onConfirm={() => onDelete!(data)}
        >
          {t("Slots.NonReversible")}
        </ConfirmDialog>
      )}
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
  typeIcon: {
    opacity: 0.5,
  },
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
  duration: {
    "&.MuiButton-root.Mui-disabled.MuiButton-textPrimary": {
      color: theme.palette.primary.main,
    },
    borderColor: theme.palette.divider,
  },
  helpText: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: theme.palette.divider,
    padding: 0,
  },
  endTime: {
    color: theme.palette.grey[700],
  },
  "&.MuiPaper-elevation8": {
    border: "2px solid red",
  },
  selected: {
    backgroundColor: theme.palette.warning.light,
  },
}));

export default Slot;
