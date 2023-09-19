import { EmailType } from "../enums/email";

export const defaultEmailTemplates = {
  [EmailType.SendBookingsLink]: {
    subject: "prenotazioni lezioni di {{ organizationName }}",
    html: `<p>Ciao {{ name }},</p>
    Ti inviamo un link per prenotare le tue prossime lezioni con {{ organizationName }}:
    <a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>`,
  },
  [EmailType.SendCalendarFile]: {
    subject: `Calendario prenotazioni {{ organizationName }}`,
    html: `<p>Ciao {{ name }},</p>
    <p>Ti inviamo un file per aggiungere le tue prossime lezioni con {{ organizationName }} al tuo calendario:</p>
    <p><a href="{{ calendarFile }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a></p>`,
  },
  [EmailType.SendExtendedBookingsDate]: {
    subject: `Ciao {{ name }},`,
    html: `<p>Ti inviamo un link per prenotare le tue prossime lezioni con {{ organizationName }}:</p>
    <p><a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a></p>`,
  },
};
