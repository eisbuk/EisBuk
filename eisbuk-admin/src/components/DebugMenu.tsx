import React, { useState } from "react";
import firebase from "firebase/app";

import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

import BugReportIcon from "@material-ui/icons/BugReport";

import { getOrganization } from "@/utils/helpers";
import { __functionsZone__ } from "@/lib/constants";

const DebugMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    setAnchorEl(e.currentTarget);
  };

  /** @TEMP below, needs to be typed with cloud functions */
  const handleClose = (functionName?: string, params?: any) => async () => {
    setAnchorEl(null);
    if (functionName) {
      try {
        const res = await firebase
          .app()
          .functions(__functionsZone__)
          .httpsCallable(functionName)({
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
        <MenuItem onClick={handleClose("createTestData")}>
          Create 1 athlete
        </MenuItem>
        <MenuItem onClick={handleClose("createTestData", { howMany: 100 })}>
          Create 100 athletes
        </MenuItem>
        <MenuItem onClick={handleClose("createTestSlots")}>
          Create slots
        </MenuItem>
      </Menu>
    </>
  );
};

export default DebugMenu;
