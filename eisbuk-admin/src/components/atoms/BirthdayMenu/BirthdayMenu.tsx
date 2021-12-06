import React, { useState } from "react";

import { Customer } from "eisbuk-shared";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { IconButton } from "@material-ui/core";

import Cake from "@material-ui/icons/Cake";

interface Props {
  customers: Customer[];
}
const BirthdayMenu: React.FC<Props> = ({ customers }) => {
  const [birthdaysAnchorEl, setBirthdaysAnchorEl] =
    useState<HTMLElement | null>(null);
  const handleBirthdaysClick: React.MouseEventHandler<HTMLSpanElement> = (
    e
  ) => {
    setBirthdaysAnchorEl(e.currentTarget);
  };

  const handleBirthdaysClose = () => () => {
    setBirthdaysAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleBirthdaysClick}>
        <Cake />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={birthdaysAnchorEl}
        keepMounted
        open={Boolean(birthdaysAnchorEl)}
        onClose={handleBirthdaysClose()}
      >
        {customers?.map((customer) => {
          console.log(customer.name);
          return (
            !customer.deleted && (
              <MenuItem key={customer.id}>
                {`${customer.name} ${customer.surname}`}
              </MenuItem>
            )
          );
        })}
      </Menu>
    </>
  );
};

export default BirthdayMenu;
