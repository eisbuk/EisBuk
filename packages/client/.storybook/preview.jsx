import React from "react";
import { StoryRouter } from "storybook-react-router";
import { Provider } from "react-redux";

// Import stylesheet importing tailwind to allow
// for tailwind styles creation for stories
import "../src/main.css";

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
];
