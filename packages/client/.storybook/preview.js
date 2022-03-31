import React from "react";
import { muiTheme } from "storybook-addon-material-ui5";
import { StoryRouter } from "storybook-react-router";
import { Provider } from "react-redux";

import "@/@eisbuk/translations/i18n";

import { available as availableThemes } from "@/themes";

import { store } from "@/store";
import { changeCalendarDate } from "@/store/actions/appActions";

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
