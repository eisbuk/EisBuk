import React, { useState } from "react";

import { getApp } from "@firebase/app";
import { getFunctions, httpsCallable } from "@firebase/functions";

import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import BugReportIcon from "@mui/icons-material/BugReport";

import { getOrganization } from "@/lib/getters";
import { __functionsZone__ } from "@/lib/constants";

import { CloudFunction } from "@/enums/functions";
import {
  __debugButtonId__,
  __create100Athletes__,
} from "@/__testData__/testIds";
import makeStyles from "@mui/styles/makeStyles";

const app = getApp();
const functions = getFunctions(app, __functionsZone__);

const DebugMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose =
    (functionName?: CloudFunction, params?: any) => async () => {
      setAnchorEl(null);
      if (functionName) {
        try {
          const res = await httpsCallable(
            functions,
            functionName
          )({
            ...params,
            organization: getOrganization(),
          });

          console.log(res.data);
        } catch (err) {
          console.error(err);
        }
      }
    };

  const classes = useStyles();

  return (
    <>
      <Button
        color="secondary"
        className={classes.buttonSecondary}
        variant="contained"
        startIcon={<BugReportIcon />}
        onClick={handleClick}
        data-testid={__debugButtonId__}
      >
        Debug
      </Button>

      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose()}
      >
        <MenuItem onClick={handleClose(CloudFunction.CreateTestData)}>
          Create 1 athlete
        </MenuItem>
        <MenuItem
          data-testid={__create100Athletes__}
          onClick={handleClose(CloudFunction.CreateTestData, {
            numUsers: 100,
          })}
        >
          Create 100 athletes
        </MenuItem>
        <MenuItem onClick={handleClose(CloudFunction.CreateTestSlots)}>
          Create slots
        </MenuItem>
      </Menu>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  buttonSecondary: {
    backgroundColor: theme.palette.secondary.main,
  },
}));

export default DebugMenu;
