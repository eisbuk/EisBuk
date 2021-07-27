import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Box, Chip } from "@material-ui/core";
import { ChevronRight } from "@material-ui/icons";

import { Duration } from "eisbuk-shared";

import { MappedSlotLabels } from "@/config/appConfig";

import { ETheme } from "@/themes";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {
    "& >*": {
      marginRight: theme.spacing(0.5),
      marginBottom: theme.spacing(0.5),
    },
  },
  duration: {
    fontWeight: 700,
    color: theme.palette.grey[200],
    fontSize: theme.typography.h6.fontSize,
  },
}));

interface Props {
  durations: Duration[];
  labels: MappedSlotLabels;
}

const DurationsList: React.FC<Props> = ({ durations, labels }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root} flexWrap="wrap">
      {durations.map((duration) => (
        <Chip
          icon={<ChevronRight />}
          size="small"
          variant="outlined"
          label={labels.durations[duration].label}
        />
      ))}
    </Box>
  );
};

export default DurationsList;
