import React from "react";
import { ComponentMeta } from "@storybook/react";

import { Customer } from "@eisbuk/shared";

import AthleteAvatarMenu from "./AthleteAvatarMenu";

export default {
  title: "Athlete Avatar Menu",
  component: AthleteAvatarMenu,
} as ComponentMeta<typeof AthleteAvatarMenu>;

const currentAthlete = {
  name: "Salvo",
  surname: "Simonetti",
  photoURL:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
} as Customer;

const otherAccounts = [
  {
    name: "Pablo Emilio",
    surname: "Escobar Gaviria",
  } as Customer,
  {
    name: "Saul",
    surname: "Goodman",
  } as Customer,
];

export const Default = (): JSX.Element => (
  <div>
    <AthleteAvatarMenu
      currentAthlete={currentAthlete}
      otherAccounts={otherAccounts}
    />
  </div>
);

export const WithNoOtherAccounts = (): JSX.Element => (
  <div>
    <AthleteAvatarMenu currentAthlete={currentAthlete} />
  </div>
);
