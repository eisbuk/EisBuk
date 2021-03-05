import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import {
  Avatar,
  Box,
  Typography,
  DeleteIcon,
  IconButton,
} from "@material-ui/core";

import { DateTime } from "luxon";
import { slotsLabels } from "../../../config/appConfig";
import DurationsList from "./DurationsList";
import UserAvatar from "./UserAvatar";
import { AddCircleOutline } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
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

export const SlotCard = ({ deleteSlot, slot }) => {
  const classes = useStyles();
  const slotDateTime = DateTime.fromSeconds(date.seconds);

  const { date, durations, categories, type, notes } = slot;

  const handleDelete = (e) => {
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
        <Typography variant="h2" className={classes.slotTi}>
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
              {slotsLabels.categories[category].label}
            </Typography>
          ))}
          {type && (
            <Typography
              variant="subtitle1"
              color="textSecondary"
              className={classes.type}
            >
              {slotsLabels.types[type].label}
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
