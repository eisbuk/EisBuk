import { DateTime } from "luxon";

import {
  Customer,
  getSlotTimespan,
  SlotInterface,
  SlotInterval,
  SlotType,
  comparePeriodsEarliestFirst,
  comparePeriodsLongestFirst,
} from "@eisbuk/shared";
import { getIntervalString } from "@eisbuk/shared/ui";
import i18n, { ActionButton, DateFormat } from "@eisbuk/translations";

import {
  TestID,
  testId,
  TestIDMetaLookup,
  TestIDWithMeta,
} from "@eisbuk/testing/testIds";

/**
 * As painful as the node resolution is nowadays, it was easier to simply extract the type
 * from the way we plan to use it (and that is to call it from `cy.intercept` with the `req` param)
 */
type HttpRequestInterceptor = Extract<
  Parameters<typeof cy.intercept>[2],
  (req: any) => any
>;

type IntervalCheck = SlotInterval & Partial<Pick<SlotInterface, "type">>;

interface MatchCalendarCardPayload {
  date: string;
  interval: IntervalCheck | string;
  type?: SlotType;
}

// ***********************************************************
//
// When adding a new Command in command initializing procedure, add the
// function interface here as well in order to be able to use
// it in tests without TypeScript complaining
//
// All of the commands should extend the following interface:
//
//       (...args?: any[]) => Chainable<R extends any = null>
//

// ***********************************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * @param {string} attr A DOM element attribute - e.g [attr=]
       * @param {string} label A value for the attribute - [=label]
       * @param {boolean} strict Default True. False means attribute value can contain label - [*=label]
       * @returns {Chainable<Element>} a `PromiseLike` yielding found `Element`
       */
      getAttrWith: (
        attr: string,
        label: string,
        strict?: boolean
      ) => Chainable<JQuery<HTMLElement>>;
      /**
       * @param {string} testId Element data-testid attribute
       * @returns {Chainable<Element>} a `PromiseLike` yielding found `Element`
       */
      getByTestId<I extends TestIDWithMeta>(
        testId: I,
        meta: TestIDMetaLookup[I]
      ): Chainable<JQuery<HTMLElement>>;
      getByTestId(testId: TestID): Chainable<JQuery<HTMLElement>>;
      /**
       * @param {number} millis milliseconds from UNIX epoch, such as it's received from `Date.now()`.
       */
      setClock: (millis: number) => Chainable<Clock>;
      /**
       * Helper used to reduce test code redundancy.
       * Fills in the form for a passed customer.
       * Each field in customer param is optional, so the function
       * will only fill fields which are passed in.
       * @customer customer entry
       */
      fillInCustomerData: (customer: Partial<Customer>) => Chainable<void>;
      /**
       * Cancels the existing `CustomerForm` ane opens a new one
       */
      resetCustomerForm: () => Chainable<void>;
      /**
       * Similar to `Chainable<Element>.type(input)`:
       * - performs `.clear()` on an element
       * - performs `.type(input)` on an element
       * - performs `.blur()` after typing in the value
       * @param {string} input
       */
      clearAndType: (input: string) => Chainable<JQuery<HTMLElement>>;
      /**
       * A convenience method to avoid typing `get("button").contains(<label>).click()` each time.
       * Always uses `click({ force: true })` to avoid failing on buttons detatched after click.
       * @param {string} label button label
       * @param {number} eq optional element index (if multiple elements found)
       */
      clearTypeAndEnter: (input: string) => Chainable<JQuery<HTMLElement>>;
      /**
       * A convenience method to avoid typing `get("button").contains(<label>).click()` each time.
       * Always uses `click({ force: true })` to avoid failing on buttons detatched after click.
       * After entering the given string it types a newline (useful to submit a form).
       * @param {string} label button label
       * @param {number} eq optional element index (if multiple elements found)
       */
      clickButton: (
        label: string,
        eq?: number
      ) => Chainable<JQuery<HTMLElement>>;
      /**
       * A utility wrapper around cy.intercept. Allows us to intercept the message the specified number
       * of times, after which the request goes through.
       * @param {number} times number of times to intercept
       * @param {string} method HTTP method to intercept
       * @param {string} url URL string to match
       * @param {HttpRequestInterceptor} cb an interceptor function to stub the behaviour of the intercepted call
       */
      interceptTimes: (
        times: number,
        method: string,
        url: string,
        cb: HttpRequestInterceptor
      ) => Chainable<null>;
      /**
       * A matcher to get a slots day container element for the passed-in date
       * @param date iso date
       */
      getSlotsDayContainer: (date: string) => Chainable<JQuery<HTMLElement>>;
      /**
       * Gets a booking card for a given interval. Please note that this will return all of the
       * cards containing the same interval, so for best results, scope it under the day.
       *
       * @TODO matching all intervals is not ideal and, for now, we mitigate this by using test data
       * with unique intervals. If the need should arise, this should be extended for more fine-grained control.
       */
      getBookingsCard: (interval: string) => Chainable<JQuery<HTMLElement>>;
      /** A convenience method used to click a "Book" button within a bookings card. */
      book: () => Chainable<JQuery<HTMLElement>>;
      matchBookingsCard: (
        interval: IntervalCheck,
        booked?: boolean
      ) => Chainable<JQuery<HTMLElement>>;
      matchBookingsDay: (
        slots: Record<string, SlotInterface>,
        bookedIntervals?: string[]
      ) => Chainable<JQuery<HTMLElement>>;
      matchCalendarCard: (
        payload: MatchCalendarCardPayload
      ) => Chainable<JQuery<HTMLElement>>;
      matchCalendarMonth: (
        intervals: MatchCalendarCardPayload[]
      ) => Chainable<JQuery<HTMLElement>>;
    }
  }
}

/**
 * We're initializing custom commands as a procedure, rather than a
 * file as this (for whatever reason) works with typescript, and the other approach doesn't
 */
export default (): void => {
  Cypress.Commands.add("getAttrWith", (attr, label, strict = true) => {
    const glob = strict ? "" : "*";
    return cy.get(`[${attr}${glob}="${label}"]`);
  });

  Cypress.Commands.add("getByTestId", (...params) => {
    return cy.get(`[data-testid="${testId(...params)}"]`);
  });

  Cypress.Commands.add("setClock", (millis) =>
    cy.clock().then((clock) => {
      clock.restore();
      // currently we're only overriding the `Date` object
      // as overriding `setTimeout` will mess with firebase auth state
      // due to firebase auth being set up to revalidate the token each hour
      return cy.clock(millis, ["Date"]);
    })
  );

  // #region CustomerForm
  Cypress.Commands.add("fillInCustomerData", (customer: Partial<Customer>) => {
    const {
      name,
      surname,
      email,
      phone,
      birthday,
      categories,
      certificateExpiration,
    } = customer;

    if (name) {
      cy.getAttrWith("name", "name").type(name);
    }
    if (surname) {
      cy.getAttrWith("name", "surname").type(surname);
    }
    if (email) {
      cy.getAttrWith("name", "email").type(email);
    }
    if (phone) {
      cy.getAttrWith("name", "phone").type(phone);
    }
    if (birthday) {
      cy.getAttrWith("placeholder", "dd/mm/yyyy").first().type(birthday);
    }
    if (categories) {
      categories.forEach((cat) => cy.getAttrWith("value", cat).check());
    }
    if (certificateExpiration) {
      cy.getAttrWith("placeholder", "dd/mm/yyyy")
        .eq(1)
        .type(certificateExpiration);
    }
  });

  Cypress.Commands.add("resetCustomerForm", () => {
    // close the form
    cy.get("button")
      .contains(i18n.t(ActionButton.Cancel) as string)
      // use force as button will be detached after click
      .click({ force: true });
    // open new form
    cy.getByTestId("add-athlete").click();
  });
  // #endregion CustomerForm

  // #region customer_bookings
  Cypress.Commands.add(
    "getSlotsDayContainer",
    { prevSubject: "optional" },
    ($el, dateISO: string) => {
      const container = $el ? cy.wrap($el) : cy.document();
      const date = DateTime.fromISO(dateISO);
      let matcher = `[data-testid=${testId("slots-day-container")}]`;
      matcher += `:has(:contains(${i18n.t(DateFormat.Full, { date })}))`;
      return container.find(matcher);
    }
  );

  Cypress.Commands.add(
    "getBookingsCard",
    { prevSubject: "optional" },
    ($el, interval: string) => {
      const container = $el ? cy.wrap($el) : cy.document();
      let matcher = `[data-testid=${testId("booking-interval-card")}]`;
      matcher += `:has(:contains(${getIntervalString(interval)}))`;
      return container.find(matcher);
    }
  );
  Cypress.Commands.add("book", { prevSubject: "element" }, ($parent) =>
    cy.wrap($parent).clickButton(i18n.t(ActionButton.BookInterval))
  );

  Cypress.Commands.add(
    "matchBookingsCard",
    { prevSubject: "element" },
    ($el, interval: IntervalCheck, booked = false) => {
      const el = cy.wrap($el);

      el.should("contain", getIntervalString(interval));

      if (interval.type) {
        el.should("contain", interval.type);
      }

      // Check only of 'booked' explicitly 'true'
      if (booked === true) {
        el.should("contain", i18n.t(ActionButton.Cancel) as string);
      }

      // Check only of 'booked' explicitly 'false'
      if (booked === false) {
        el.should("contain", i18n.t(ActionButton.BookInterval) as string);
      }
    }
  );

  Cypress.Commands.add(
    "matchBookingsDay",
    { prevSubject: "element" },
    (
      $el,
      slots: Record<string, SlotInterface>,
      bookedIntervals: string[] = []
    ) => {
      const intervals = slotsDayToIntervals(slots);
      const numIntervals = intervals.length;

      const cardsMatcher = `[data-testid=${testId("booking-interval-card")}]`;

      cy.wrap($el).find(cardsMatcher).should("have.length", numIntervals);

      const _bookedIntervals = bookedIntervals.map(getIntervalString);

      intervals.forEach((interval, i) => {
        const booked = _bookedIntervals.includes(getIntervalString(interval));
        cy.wrap($el)
          .find(cardsMatcher)
          .eq(i)
          .matchBookingsCard(interval, booked);
      });
    }
  );

  Cypress.Commands.add(
    "matchCalendarCard",
    { prevSubject: "element" },
    ($el, { date, interval, type }: MatchCalendarCardPayload) => {
      const el = cy.wrap($el);

      el.should(
        "contain",
        i18n.t(DateFormat.Full, { date: DateTime.fromISO(date) })
      );
      el.should("contain", getIntervalString(interval));

      if (type) {
        el.should("contain", type);
      }
    }
  );

  Cypress.Commands.add(
    "matchCalendarMonth",
    { prevSubject: "optional" },
    ($el, intervals: MatchCalendarCardPayload[]) => {
      const container = () => ($el ? cy.wrap($el) : cy.document());

      const numIntervals = intervals.length;

      const cardsMatcher = `[data-testid=${testId("booking-calendar-card")}]`;

      container().find(cardsMatcher).should("have.length", numIntervals);

      intervals.forEach((interval, i) =>
        container().find(cardsMatcher).eq(i).matchCalendarCard(interval)
      );
    }
  );

  // #endregion customer_bookings

  Cypress.Commands.add(
    "clearAndType",
    { prevSubject: ["element"] },
    ($el, input) =>
      cy.wrap($el).should("not.be.disabled").clear().type(input).blur()
  );

  Cypress.Commands.add(
    "clearTypeAndEnter",
    { prevSubject: ["element"] },
    ($el, input) =>
      cy
        .wrap($el)
        .clear()
        .type(input + "\n")
  );

  Cypress.Commands.add(
    "clickButton",
    { prevSubject: "optional" },
    ($el, label: string, eq = 0) => {
      const container = $el ? cy.wrap($el) : cy;
      return (
        container
          // include ':contains()' in the selector to retry the assertion until the element is found
          // and prevent assertions on wrong buttons (in a render race condition kind of way)
          .find(`button:contains(${label})`)
          // if multiple elements found, get the specified 'eq' or fall back to first element found
          .eq(eq)
          .click({ force: true })
      );
    }
  );

  Cypress.Commands.add(
    "interceptTimes",
    (times: number, method: any, url: string, cb: HttpRequestInterceptor) =>
      cy.intercept(method, url, (req) => {
        if (times) {
          times--;
          return cb(req);
        } else {
          return req.continue();
        }
      })
  );
};

// #region helpers
/**
 * Extracts intervals from the slot, for matching against the UI.
 * The intervals are sorted in the same order as they will be renderd within the IntervalCardGroup.
 */
const slotToIntervals = (slot: SlotInterface): IntervalCheck[] => {
  const { type, intervals } = slot;
  return Object.values(intervals)
    .map((interval) => ({ ...interval, type }))
    .sort(comparePeriodsLongestFirst);
};

/**
 * Takes in a full slots day, extracts intervals for each slot and sorts them in the same order
 * as they should appear in SlotsDayContainer.
 */
const slotsDayToIntervals = (slots: Record<string, SlotInterface>) =>
  Object.values(slots)
    .sort(({ intervals: i1 }, { intervals: i2 }) => {
      const ts1 = getSlotTimespan(i1).replace(" ", "");
      const ts2 = getSlotTimespan(i2).replace(" ", "");
      return comparePeriodsEarliestFirst(ts1, ts2);
    })
    .flatMap(slotToIntervals);
// #endregion helpers
