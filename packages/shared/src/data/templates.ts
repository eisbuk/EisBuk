import { ClientMessageType } from "../enums/clientMessage";

export const defaultEmailTemplates = {
  [ClientMessageType.SendBookingsLink]: {
    subject: "prenotazioni lezioni di {{ organizationName }}",
    html: `<p>Ciao {{ name }},</p>
    Ti inviamo un link per prenotare le tue prossime lezioni con {{ organizationName }}:
    <a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>`,
  },
  [ClientMessageType.SendCalendarFile]: {
    subject: `Calendario prenotazioni {{ organizationName }}`,
    html: `<p>Ciao {{ name }},</p>
    <p>Ti inviamo un file per aggiungere le tue prossime lezioni con {{ organizationName }} al tuo calendario:</p>
    <p><a href="{{ calendarFile }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a></p>`,
  },
  [ClientMessageType.SendExtendedBookingsDate]: {
    subject: `Ciao {{ name }},`,
    html: `<p>Ti inviamo un link per prenotare le tue prossime lezioni con {{ organizationName }}:</p>
    <p><a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a></p>`,
  },
};

export const defaultSMSTemplates = {
  [ClientMessageType.SendBookingsLink]: `Ciao {{ name }},
    Ti inviamo un link per prenotare le tue prossime lezioni con {{ organizationName }}:
    {{ bookingsLink }}`,

  [ClientMessageType.SendExtendedBookingsDate]: `Ti inviamo un link per prenotare le tue prossime lezioni con {{ organizationName }}:
    {{ bookingsLink }}`,
};
