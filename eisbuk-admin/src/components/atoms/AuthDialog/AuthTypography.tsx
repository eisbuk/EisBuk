import React from "react";

import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

const AuthTypography: React.FC<{ variant: "body1" | "caption" }> = ({
  children,
  variant,
}) => {
  const classes = useStyles();

  return (
    <Typography className={classes[variant]} {...{ variant }}>
      {children}
    </Typography>
  );
};

const useStyles = makeStyles(() => ({
  body1: {},
  caption: {
    color: "#757575",
    display: "block",
    maxWidth: 312,
  },
}));

export default AuthTypography;
