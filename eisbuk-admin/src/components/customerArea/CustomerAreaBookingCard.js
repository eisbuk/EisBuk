import React from "react";
import { Card, CardContent, Typography, Button, Box } from "@material-ui/core";
import ProjectIcon from "../global/ProjectIcons";
import { slotsLabels } from "../../config/appConfig";
import { FBToLuxon } from "../../data/dtutils";
import { makeStyles } from "@material-ui/styles";

const CustomerAreaBookingCard = ({ data }) => {
  const classes = useStyles();
  const slotLabel = slotsLabels.types[data.type];
  const date = FBToLuxon(data.date);
  return (
    <Card variant="outlined" className={classes.root}>
      <CardContent className={classes.content}>
        <Box className={classes.date} textAlign="center">
          <Typography variant="h5" className={classes.weekday}>
            {date.toFormat("EEE", { locale: "it-IT" })}
          </Typography>
          <Typography className={classes.day}>
            {date.toFormat("d", { locale: "it-IT" })}
          </Typography>
          <Typography className={classes.month}>
            {date.toFormat("MMMM", { locale: "it-IT" })}
          </Typography>
        </Box>
        <Box
          className={classes.body}
          display="flex"
          flexGrow={1}
          flexDirection="column"
        >
          <Box display="flex" flexGrow={1} className={classes.topWrapper}>
            <Box className={classes.time}>
              <Typography
                color="primary"
                display="inline"
                variant="h5"
                component="h2"
              >
                <strong>{date.toISOTime().substring(0, 5)}</strong>
              </Typography>
              <Typography
                className={classes.endTime}
                display="inline"
                variant="h6"
                component="h3"
              >
                {" "}
                -{" "}
                {date
                  .plus({ minutes: data.duration })
                  .minus({ minutes: 10 })
                  .toISOTime()
                  .substring(0, 5)}
              </Typography>
            </Box>
            {data.notes && (
              <Box
                display="flex"
                className={classes.notesWrapper}
                alignItems="center"
              >
                <Typography className={classes.notes}>{data.notes}</Typography>
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
              <Button
                key={data.duration}
                color="primary"
                variant="text"
                className={classes.duration}
                disabled
              >
                {slotsLabels.durations[data.duration].label}
              </Button>
            </Box>
            <Box
              flexGrow={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              pl={1}
              pr={1}
            >
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
                {slotLabel.label}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

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
      //Fix for Material-UI defaulting this to 24
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
}));

export default CustomerAreaBookingCard;
