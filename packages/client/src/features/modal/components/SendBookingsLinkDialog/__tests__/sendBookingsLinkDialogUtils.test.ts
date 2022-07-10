import { SendBookingLinkMethod } from "@/enums/other";
import i18n, { Prompt } from "@eisbuk/translations";

import { getDialogPrompt } from "../utils";

const testPhone = "12345";
const testEmail = "testio@test.com";

type TestParams = Parameters<typeof getDialogPrompt>[0] & {
  name: string;
  want: ReturnType<typeof getDialogPrompt>;
};

const runGetDialogTableTests = (tests: TestParams[]) =>
  tests.forEach(({ name, want, ...inputParams }) => {
    test(name, () => {
      expect(getDialogPrompt(inputParams)).toEqual(want);
    });
  });

describe("Send bookings link dialog utils", () => {
  describe("getDialogPrompt", () =>
    runGetDialogTableTests([
      {
        name: "should display 'email' prompt for method = \"email\" when 'email' defined",
        method: SendBookingLinkMethod.Email,
        email: testEmail,
        want: {
          title: i18n.t(Prompt.SendEmailTitle),
          body: i18n.t(Prompt.ConfirmEmail, { email: testEmail }),
          disabled: false,
        },
      },
      {
        name: "should display 'sms' prompt for method = \"sms\" when 'phone' defined",
        method: SendBookingLinkMethod.SMS,
        phone: testPhone,
        want: {
          title: i18n.t(Prompt.SendSMSTitle),
          body: i18n.t(Prompt.ConfirmSMS, { phone: testPhone }),
          disabled: false,
        },
      },
      {
        name: "should display 'no-email' prompt and disable confirmation for method = \"email\" when 'email' undefined",
        method: SendBookingLinkMethod.Email,
        want: {
          title: i18n.t(Prompt.NoEmailTitle),
          body: i18n.t(Prompt.NoEmailMessage),
          disabled: true,
        },
      },
      {
        name: "should display 'no-sms' prompt and disable confirmation for method = \"sms\" when 'phone' undefined",
        method: SendBookingLinkMethod.SMS,
        want: {
          title: i18n.t(Prompt.NoPhoneTitle),
          body: i18n.t(Prompt.NoPhoneMessage),
          disabled: true,
        },
      },
    ]));
});
