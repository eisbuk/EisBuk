import React from "react";
import _ from "lodash";

import Avatar from "@material-ui/core/Avatar";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

import LockOutlinedIcon from "@material-ui/icons/LockOutlined";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { organizationInfo } from "@/themes";

import AuthDialog from "@/components/atoms/AuthDialog";

import FigureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import FigureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import FigureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import GirlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import IceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

const loginBackgrounds = [
  <FigureSkatingSilhouetteCouple />,
  <FigureSkatingSilhouetteSkirt />,
  <FigureSkatingSilhouette />,
  <GirlIceSkating />,
  <IceSkatingSilhouette />,
];

const LoginImage = () => _.sample(loginBackgrounds) || null;

const SignInSide: React.FC = () => {
  const classes = useStyles();

  return (
    <Grid container component="main" className={classes.root}>
      <Grid item className={classes.image} xs={false} sm={4} md={7}>
        <LoginImage />
      </Grid>
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {organizationInfo.name}
          </Typography>
          <AuthDialog />
        </div>
      </Grid>
    </Grid>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
  image: {
    maxHeight: "100vh",
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
}));

export default SignInSide;
