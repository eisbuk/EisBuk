import React from "react";
import { store } from "../src/store";
import { StoryRouter } from "storybook-react-router";
import { Provider } from "react-redux";
import { changeCalendarDate } from "../src/store/actions/actions";
import { available as availableThemes } from "../src/themes";
import { muiTheme } from "storybook-addon-material-ui";

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
