export const expectedIcsFile = new RegExp(
  "BEGIN:VCALENDAR\n" +
    "VERSION:2.0\n" +
    "BEGIN:VEVENT\n" +
    "CLASS:PUBLIC\n" +
    "DESCRIPTION:\n" +
    "LOCATION:\n" +
    "SUMMARY:Booked ice Slot at \n" +
    "TRANSP:TRANSPARENT\n" +
    "DTSTART:20210301T090000Z\n" +
    "DTEND:20210301T100000Z\n" +
    "UID:0900100020210301\n" +
    "END:VEVENT\n" +
    "BEGIN:VEVENT\n" +
    "CLASS:PUBLIC\n" +
    "DESCRIPTION:\n" +
    "LOCATION:\n" +
    "SUMMARY:Booked ice Slot at \n" +
    "TRANSP:TRANSPARENT\n" +
    "DTSTART:20210301T090000Z\n" +
    "DTEND:20210301T100000Z\n" +
    "UID:0900100020210301\n" +
    "END:VEVENT\n" +
    "END:VCALENDAR\n" +
    "UID:[a-z0-9]*\n" +
    "DTSTAMP:[0-9]*\n" +
    "PRODID:localhost"
);
