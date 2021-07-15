import React, { useState } from "react";
import firebase from "firebase/app";
import { Button, Menu, MenuItem } from "@material-ui/core";
import { BugReport as BugReportIcon } from "@material-ui/icons";

import { functionsZone } from "@/config/envInfo";
import { ORGANIZATION } from "@/config/envInfo";

const DebugMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    setAnchorEl(e.currentTarget);
  };

  /** @TEMP below */
  const handleClose = (functionName?: string, params?: any) => () => {
    setAnchorEl(null);
    if (functionName) {
      firebase
        .app()
        .functions(functionsZone)
        .httpsCallable(functionName)({ ...params, organization: ORGANIZATION })
        .then(function (response) {
          console.log(response.data);
        });
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
