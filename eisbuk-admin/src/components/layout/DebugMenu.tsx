import React, { useState } from "react";

import { getApp } from "@firebase/app";
import { getFunctions, httpsCallable } from "@firebase/functions";

import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

import BugReportIcon from "@material-ui/icons/BugReport";

import { getOrganization } from "@/lib/getters";
import { __functionsZone__ } from "@/lib/constants";

import { CloudFunction } from "@/enums/functions";
import {
  __debugButtonId__,
  __create100Athletes__,
} from "@/__testData__/testIds";

const app = getApp();
const functions = getFunctions(app, __functionsZone__);

const DebugMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    setAnchorEl(e.currentTarget);
  };

  /** @TEMP below, needs to be typed with cloud functions */
  const handleClose = (
    functionName?: CloudFunction,
    params?: any
  ) => async () => {
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

  return (
    <>
      <Button
        color="secondary"
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

export default DebugMenu;
