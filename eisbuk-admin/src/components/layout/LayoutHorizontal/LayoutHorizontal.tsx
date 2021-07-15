import React from "react";

import { makeStyles } from "@material-ui/styles";
import { Box, Grid, Typography } from "@material-ui/core";

import { ETheme } from "@/themes";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {
    minHeight: "100vh",
  },
  navRail: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  heading: {
    fontWeight: 300,
  },
  contentRail: {
    backgroundColor: theme.palette.grey[50],
  },
}));

interface Props {
  heading: string;
  navRail: string | JSX.Element;
  contentRail: string | JSX.Element;
  callToAction: string | JSX.Element;
}

const LayoutHorizontal: React.FC<Props> = ({
  heading,
  navRail,
  contentRail,
  callToAction,
}) => {
  const classes = useStyles();
  return (
    <Grid container className={classes.root}>
      <Grid item xs={12} md={4} className={classes.navRail}>
        {heading && (
          <Box p={3} display="flex">
            <Box>
              <Typography className={classes.heading} variant="h3">
                {heading}
              </Typography>
            </Box>
            <Box display="flex">{callToAction}</Box>
          </Box>
        )}
        {navRail}
      </Grid>
      <Grid item xs={12} md={8} className={classes.contentRail}>
        {contentRail}
      </Grid>
    </Grid>
  );
};

export default LayoutHorizontal;
