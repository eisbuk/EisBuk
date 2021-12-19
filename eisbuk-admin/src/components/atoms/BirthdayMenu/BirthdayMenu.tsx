import React, { useState } from "react";
import { DateTime } from "luxon";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { Divider, IconButton } from "@material-ui/core";

import Cake from "@material-ui/icons/Cake";

import { CustomersByBirthday } from "eisbuk-shared";

interface Props {
  customers: CustomersByBirthday[];
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
  const today = DateTime.now().toISODate().substring(5);

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
        {customers.map((customer) => {
          const customerBirthday = customer.birthday;
          return (
            <div key={customer.birthday}>
              <MenuItem>
                {customerBirthday === today ? "today" : customerBirthday}
              </MenuItem>
              <Divider />
              {customer.customers.map(
                (cus) =>
                  !cus.deleted && (
                    <MenuItem key={cus.id}>
                      {`${cus.name} ${cus.surname}`}
                    </MenuItem>
                  )
              )}
              <Divider />
            </div>
          );
        })}
      </Menu>
    </>
  );
};

export default BirthdayMenu;
