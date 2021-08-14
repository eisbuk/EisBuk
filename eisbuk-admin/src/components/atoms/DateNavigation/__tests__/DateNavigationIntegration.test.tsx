import React from "react";
import { screen } from "@testing-library/react";
import { Route } from "react-router-dom";
import { DateTime } from "luxon";

import DateNavigation from "../DateNavigation";

import { __incrementId__ } from "../__testData__/testData";

import { renderWithRouter } from "@/__testUtils__/wrappers";

import { luxon2ISODate } from "@/utils/date";

describe("DateNavigation", () => {
  describe("Integration test 'withRouter'", () => {
    test("should update local store after paginating using path", async () => {
      // initial date for tests
      const startDateISO = "2021-03-01";
      const startDate = DateTime.fromISO(startDateISO);

      // path without the `date` at the end
      const pathPrefix = "/location";

      // params for memory router
      const routerParams = {
        initialEntries: [`${pathPrefix}/${startDateISO}`],
      };

      renderWithRouter(
        <Route path={`${pathPrefix}/:date`}>
          <DateNavigation withRouter>
            {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
          </DateNavigation>
        </Route>,
        routerParams
      );
      screen.getByTestId(__incrementId__).click();

      // expected date after the pagination
      const expectedDate = startDate.plus({ weeks: 1 });
      const expectedDateISO = luxon2ISODate(expectedDate);

      await screen.findByText(expectedDateISO);
    });
  });
});
