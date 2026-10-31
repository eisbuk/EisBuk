import { DateTime } from "luxon";

import { Customer, SlotInterface } from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";
import i18n, { AdminAria, NotificationMessage } from "@eisbuk/translations";

import { customers } from "../__testData__/customers.json";
import { __testDate__ } from "../constants";

const saul = customers.saul as Customer;

/**
 * Mobile Safari can lose the connection to its IndexedDB server while a tab is in the background.
 * From then on (until the page is reloaded) Firestore can't use its local persistence and every
 * write fails locally. The app should notice and reload the page.
 *
 * We reproduce what WebKit does when it loses its IndexedDB server
 * (`IDBConnectionToServer::connectionToServerLost`): the open connections are closed (new
 * transactions throw InvalidStateError) and every later `indexedDB.open` fails with UnknownError
 * "Connection to Indexed Database server lost. Refresh the page to try again".
 * A reload gets a fresh, healthy storage (as on iOS).
 */
interface Sim {
  loads: number;
  dbs: IDBDatabase[];
  broken: boolean;
  visibility: DocumentVisibilityState;
  setVisibility: (state: DocumentVisibilityState) => void;
  breakStorage: () => void;
  warnings: string[];
}
type SimWindow = Cypress.AUTWindow & { __sim: Sim };

const installSimulation = (win: SimWindow) => {
  // Firestore persistence is off in test builds, unless turned on with this flag
  win.localStorage.setItem("enableFirestorePersistence", "true");

  const loads = Number(win.sessionStorage.getItem("simLoads") || 0) + 1;
  win.sessionStorage.setItem("simLoads", String(loads));

  const sim: Sim = {
    loads,
    dbs: [],
    broken: false,
    visibility: "visible",
    setVisibility: (state) => {
      sim.visibility = state;
      win.document.dispatchEvent(new win.Event("visibilitychange"));
    },
    breakStorage: () => {
      sim.broken = true;
      sim.dbs.forEach((db) => db.close());
    },
    warnings: [],
  };
  win.__sim = sim;

  const originalWarn = win.console.warn;
  win.console.warn = (...args: unknown[]) => {
    sim.warnings.push(args.map(String).join(" "));
    originalWarn.apply(win.console, args);
  };

  Object.defineProperty(win.Document.prototype, "visibilityState", {
    configurable: true,
    get: () => sim.visibility,
  });
  Object.defineProperty(win.Document.prototype, "hidden", {
    configurable: true,
    get: () => sim.visibility === "hidden",
  });

  const originalOpen = win.IDBFactory.prototype.open;
  win.IDBFactory.prototype.open = function open(
    this: IDBFactory,
    name: string,
    version?: number
  ) {
    if (sim.broken) {
      const request = {
        error: null as DOMException | null,
        readyState: "pending",
        onsuccess: null,
        onupgradeneeded: null,
        onblocked: null,
        onerror: null as null | ((e: unknown) => void),
        addEventListener: () => {},
        removeEventListener: () => {},
      };
      win.setTimeout(() => {
        request.error = new win.DOMException(
          "Connection to Indexed Database server lost. Refresh the page to try again",
          "UnknownError"
        );
        request.readyState = "done";
        request.onerror?.({
          type: "error",
          target: request,
          preventDefault: () => {},
          stopPropagation: () => {},
        });
      });
      return request as unknown as IDBOpenDBRequest;
    }
    const request =
      version === undefined
        ? originalOpen.call(this, name)
        : originalOpen.call(this, name, version);
    request.addEventListener("success", () => sim.dbs.push(request.result));
    return request;
  };
};

// The app's clock is set to `__testDate__` (support/index.ts): it's the first day of a month,
// so the athlete can book the following month
const month = DateTime.fromISO(__testDate__).plus({ months: 1 });
const date = month.set({ day: 15 });
const interval = "09:00-10:00";
const slot: SlotInterface = {
  id: "storage-recovery-slot",
  date: date.toISODate()!,
  type: "ice",
  categories: saul.categories,
  intervals: { [interval]: { startTime: "09:00", endTime: "10:00" } },
  notes: "",
} as SlotInterface;

/**
 * Sets the app's (fake, see support/index.ts) clock to `hours` after `__testDate__`.
 * Each test starts at a different time: the pages of a previous test leave Firestore's
 * persistence lease behind, stamped with their (frozen) time; a page at the same time
 * would consider it still held and fall back to memory persistence.
 */
const startClockAt = (hours: number) =>
  cy.setClock(DateTime.fromISO(__testDate__).plus({ hours }).toMillis());

const getSim = () => cy.window().its("__sim") as Cypress.Chainable<Sim>;

/**
 * Opens the athlete's booking page (`visit = false`: the page is already loaded)
 * and navigates to the month of the test slot.
 */
const openBookingMonth = (visit = true) => {
  if (visit) {
    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
  }
  // Make sure the test runs with Firestore's IndexedDB persistence
  getSim().should((sim: Sim) => {
    expect(sim.dbs.some((db) => db.name.startsWith("firestore/"))).to.be.true;
    expect(sim.warnings.join("\n")).not.to.contain("persistence can only be");
  });
  cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();
  // The athlete's data (and the slot) has arrived
  cy.getByTestId("book-button").should("be.visible");
};

const bookAndExpectSuccess = () => {
  cy.getByTestId("book-button").first().click({ force: true });
  cy.getByTestId("notification-toast").contains(
    i18n.t(NotificationMessage.BookingSuccess, { date, interval }) as string
  );
};

describe("Broken browser storage", () => {
  beforeEach(() => {
    // Firestore logs/throws IndexedDB errors on its own while the storage is broken
    cy.on("uncaught:exception", () => false);
    cy.on("window:before:load", (win) =>
      installSimulation(win as unknown as SimWindow)
    );
    cy.initAdminApp()
      .then((organization) =>
        cy.updateCustomers(organization, { saul } as Record<string, Customer>)
      )
      .then((organization) =>
        cy.updateSlots(organization, { [slot.id]: slot })
      );
  });

  it("reloads the page when the user comes back to a page whose storage broke", () => {
    startClockAt(1);
    openBookingMonth();
    getSim().invoke("setVisibility", "hidden");
    getSim().invoke("breakStorage");
    // The page is checked only after being hidden for at least 30 seconds
    // (the app's Date is faked by cy.clock in support/index.ts: move it forward)
    cy.tick(31 * 1000);
    getSim().invoke("setVisibility", "visible");

    cy.getByTestId("notification-toast").contains(
      i18n.t(NotificationMessage.StorageReloading) as string
    );
    // The page reloaded (once) with a healthy storage: booking works
    getSim().its("loads").should("eq", 2);
    openBookingMonth(false);
    bookAndExpectSuccess();
    getSim().its("loads").should("eq", 2);
  });

  it("reloads the page when a booking fails because the storage broke", () => {
    startClockAt(2);
    openBookingMonth();
    getSim().invoke("breakStorage");
    cy.getByTestId("book-button").first().click({ force: true });

    cy.getByTestId("notification-toast").contains(
      i18n.t(NotificationMessage.StorageReloading) as string
    );
    getSim().its("loads").should("eq", 2);
    openBookingMonth(false);
    bookAndExpectSuccess();
  });
});
