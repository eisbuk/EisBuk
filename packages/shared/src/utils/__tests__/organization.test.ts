/**
 * @jest-environment node
 */

import { defaultEmailTemplates } from "@/data/templates";
import { EmailType } from "@/enums/email";
import { interpolateText } from "../organization";

describe("Organization", () => {
  describe("InterpolateText function", () => {
    const noSpacesSendCalendarFile = `<p>Ciao {{name}},</p>
        <p>Ti inviamo un file per aggiungere le tue prossime lezioni con {{organizationName}} al tuo calendario:</p>
        <a href="{{calendarFile}}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>`;

    test("Should interpolate placeholders surrounded by {{  }} with spaces in a string into their equivalent values", () => {
      const interpolatedHtml = interpolateText(
        defaultEmailTemplates[EmailType.SendBookingsLink].html,
        {
          organizationName: "test organization",
          name: "test name",
          surname: "test surname",
          bookingsLink: "test bookingsLink",
        }
      );

      expect(interpolatedHtml).toBe(`<p>Ciao test name,</p>
    <p>Ti inviamo un link per prenotare le tue prossime lezioni con test organization:</p>
    <a href="test bookingsLink">Clicca qui per prenotare e gestire le tue lezioni</a>`);
    });

    test("Should interpolate placeholders surrounded by {{}} without spaces in a string into their equivalent values", () => {
      const interpolatedHtml = interpolateText(noSpacesSendCalendarFile, {
        organizationName: "test organization",
        name: "test name",
        surname: "test surname",
        calendarFile: "icsFile.ics",
      });

      expect(interpolatedHtml).toBe(`<p>Ciao test name,</p>
        <p>Ti inviamo un file per aggiungere le tue prossime lezioni con test organization al tuo calendario:</p>
        <a href="icsFile.ics">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>`);
    });

    test("Should not interpolate if no placeholder value was provided", () => {
      const interpolatedHtml = interpolateText(
        defaultEmailTemplates[EmailType.SendExtendedBookingsDate].subject,
        { organizationName: "test organization" }
      );

      expect(interpolatedHtml).toBe(`<p>Ciao {{ name }},</p>`);
    });
  });
});
