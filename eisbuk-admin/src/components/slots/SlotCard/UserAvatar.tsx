import React from "react";

import Avatar from "@material-ui/core/Avatar";
import Tooltip from "@material-ui/core/Tooltip";

import makeStyles from "@material-ui/styles/makeStyles";

import { ETheme } from "@/themes";

const useStyles = makeStyles((theme: ETheme) => ({
  root: {
    color:
      theme.palette.primary
        .contrastText /** @TODO check this it contained primary.main (it's either primary or contrastText) */,
    backgroundColor: theme.palette.primary.main,
  },
}));

const UserAvatar: React.FC = () => {
  const classes = useStyles();
  return (
    <Tooltip title="Osman Pizza" placement="right">
      <Avatar className={classes.root}>OP</Avatar>
    </Tooltip>
  );
};

export default UserAvatar;
