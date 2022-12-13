export const SendBookingsLinkTemplate = {
  subject: "prenotazioni lezioni di {{ displayName }}",
  html: `<p>Ciao {{ name }},</p>
    <p>Ti inviamo un link per prenotare le tue prossime lezioni con {{ displayName }}:</p>
    <a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>`,
};
export const SendCalendarFileTemplate = {
  subject: `Calendario prenotazioni {{ displayName }}`,
  html: `<p>Ciao {{ name }},</p>
    <p>Ti inviamo un file per aggiungere le tue prossime lezioni con {{ displayName }} al tuo calendario:</p>
    <a href="{{ icsFile }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>`,
};
export const SendExtendedDateTemplate = {
  subject: `<p>Ciao {{ name }},</p>`,
  html: `<p>Ti inviamo un link per prenotare le tue prossime lezioni con {{ displayName }}:</p>
    <a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>`,
};
