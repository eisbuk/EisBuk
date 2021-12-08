import React, { useState } from "react";

import { CustomerBirthday } from "eisbuk-shared";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { Divider, IconButton } from "@material-ui/core";

import Cake from "@material-ui/icons/Cake";
import { DateTime } from "luxon";

interface Props {
  customers: CustomerBirthday;
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
  const today = DateTime.now().toFormat("dd/MM");

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
        PaperProps={{
          style: {
            maxHeight: "10rem",
            width: "20ch",
          },
        }}
      >
        {Object.keys(customers).map((customerBirthdayKey) => {
          return (
            <div key={customerBirthdayKey}>
              <MenuItem>
                {customerBirthdayKey === today ? "today" : customerBirthdayKey}
              </MenuItem>
              <Divider></Divider>
              {customers[customerBirthdayKey].map((customer) => {
                return (
                  !customer.deleted && (
                    <MenuItem key={customer.id}>
                      {`${customer.name} ${customer.surname}`}
                    </MenuItem>
                  )
                );
              })}
              <Divider></Divider>
            </div>
          );
        })}
      </Menu>
    </>
  );
};

export default BirthdayMenu;
