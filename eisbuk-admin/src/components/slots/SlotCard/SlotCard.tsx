import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Box, Typography, IconButton } from "@material-ui/core";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

import DeleteIcon from "@material-ui/icons/Delete";
import AddCircleOutline from "@material-ui/icons/AddCircleOutline";

import { Slot } from "eisbuk-shared";

import { ETheme } from "@/themes";

import DurationsList from "./DurationsList";
import UserAvatar from "./UserAvatar";

import { slotsLabels } from "@/config/appConfig";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {
    backgroundColor: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
  },
  borderedLeftBox: {
    borderLeft: `1px solid ${theme.palette.grey[50]}`,
  },
  borderedBottomBox: {
    borderBottom: `1px solid ${theme.palette.grey[50]}`,
    "& >*": {
      marginRight: theme.spacing(1),
    },
  },
  category: {
    textTransform: "uppercase",
    fontWeight: 700,
  },
  type: {
    fontWeight: 300,
  },
  avatars: {
    "& >*": {
      marginRight: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
  },
}));

interface Props {
  deleteSlot: (slot: Slot<"id">) => void;
  slot: Slot<"id">;
}

export const SlotCard: React.FC<Props> = ({ deleteSlot, slot }) => {
  const { date, durations, categories, type, notes } = slot;

  const classes = useStyles();
  const slotDateTime = DateTime.fromSeconds(date.seconds);
  const { t } = useTranslation();
  const handleDelete = (e: React.SyntheticEvent) => {
    e.preventDefault();
    deleteSlot(slot);
  };

  return (
    <Box p={3} display="flex" className={classes.root}>
      <Box
        width={165}
        display="flex"
        justifyContent="center"
        flexDirection="column"
        pr={3}
      >
        <Typography
          variant="h2"
          className={(classes as any).slotTi /** @TEMP */}
        >
          {slotDateTime.toFormat("HH:mm")}
        </Typography>
        <DurationsList durations={durations} labels={slotsLabels} />
      </Box>
      <Box
        className={classes.borderedLeftBox}
        flexGrow={1}
        display="flex"
        flexDirection="column"
      >
        <Box
          display="flex"
          className={classes.borderedBottomBox}
          px={3}
          pb={1.5}
        >
          {categories.map((category) => (
            <Typography
              variant="subtitle1"
              color="textSecondary"
              className={classes.category}
            >
              {t(`Categories.${slotsLabels.categories[category].label}`)}
            </Typography>
          ))}
          {type && (
            <Typography
              variant="subtitle1"
              color="textSecondary"
              className={classes.type}
            >
              {t(`SlotTypes.${slotsLabels.types[type].label}`)}
            </Typography>
          )}
        </Box>
        <Box px={3} pt={1.5} display="flex" className={classes.avatars}>
          <UserAvatar />
          <Avatar style={{ opacity: 0.3 }}>
            <AddCircleOutline />
          </Avatar>
        </Box>
        <Box>{notes && notes}</Box>
      </Box>
      <Box>
        <IconButton aria-label="delete" color="primary" onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default SlotCard;
