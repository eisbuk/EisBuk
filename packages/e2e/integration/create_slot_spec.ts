import { DateTime } from "luxon";

import { Category, SlotType } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import i18n, {
  SlotsAria,
  SlotFormAria,
  ActionButton,
  ValidationMessage,
} from "@eisbuk/translations";

import { __testDate__ } from "../constants";

const t = i18n.t;

const createSlotSpec = () => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.signIn();
    cy.visit(PrivateRoutes.Slots);

    cy.getAttrWith("aria-label", t(SlotsAria.EnableEdit))
      .eq(0)
      .click({ force: true });
    cy.getAttrWith(
      "aria-label",
      t(SlotsAria.CreateSlot, { date: DateTime.fromISO(__testDate__) }),
      false
    )
      .eq(0)
      // we're doing force: true here since the button isn't visible
      // due to cypress' weird scrolling behaviour
      .click({ force: true });
  });

  it("fills in slot form and submits it", () => {
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(0)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(0)
      .clear()
      .type("10:30");

    cy.getAttrWith("name", "notes").type("some notes");
    cy.clickButton(t(ActionButton.Save));

    /** @TODO check for created slot or snackbar */

    /** @TODO tst for disabled checkbox */
  });

  it("creates an off-ice slot", () => {
    cy.getAttrWith("value", SlotType.OffIce).check();

    Object.values(Category).forEach((cat) => {
      cy.getAttrWith("value", cat).should("be.disabled").should("be.checked");
    });

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(0)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(0)
      .clear()
      .type("10:30");
    cy.getAttrWith("name", "notes").type("some notes");
    cy.clickButton(t(ActionButton.Save));
  });

  it("creates a multi-interval slot", () => {
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).click();

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(0)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(0)
      .clear()
      .type("10:30");

    cy.getAttrWith("aria-label", t(SlotFormAria.AddInterval)).click();

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(1)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(1)
      .clear()
      .type("10:30");

    cy.getAttrWith("name", "notes").type("some notes");
    cy.clickButton(t(ActionButton.Save));
  });

  it("shows 'invalid time format' validation error", () => {
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9");
    cy.getAttrWith("type", "text").eq(1).clear().type("10 pm");

    cy.clickButton(t(ActionButton.Save));
    cy.getAttrWith("role", "dialog").contains(
      t(ValidationMessage.InvalidTime) as string
    );
  });

  it("shows validation error for inconsistent period start/end", () => {
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9:00");
    cy.getAttrWith("type", "text").eq(1).clear().type("7:00");

    cy.clickButton(t(ActionButton.Save));
    cy.getAttrWith("role", "dialog").contains(
      t(ValidationMessage.TimeMismatch) as string
    );
  });
};

// const iphoneSe2 = {
//   viewportHeight: 667,
//   viewportWidth: 375,
// };

// TODO: create e2e tests for mobile as well
// describe("Create slot (mobile)", iphoneSe2, createSlotSpec);
describe("Create slot (desktop)", createSlotSpec);
