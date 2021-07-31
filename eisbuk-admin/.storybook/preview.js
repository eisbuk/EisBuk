import React from "react";
import { muiTheme } from "storybook-addon-material-ui";
import { StoryRouter } from "storybook-react-router";
import { Provider } from "react-redux";

import "@/i18next/i18n";

import { available as availableThemes } from "@/themes";

import { store } from "@/store";
import { changeCalendarDate } from "@/store/actions/actions";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};

export const decorators = [
  (Story, context) => {
    if (context.args.currentDate) {
      // If the current story defines a currentDate argument
      // we honour the request by dispatching to the store
      store.dispatch(changeCalendarDate(context.args.currentDate));
    }
    return (
      <Provider store={store}>
        <StoryRouter>
          <Story />
        </StoryRouter>
      </Provider>
    );
  },
  muiTheme(availableThemes),
];
