import React, { MutableRefObject } from "react";
import { useFormikContext } from "formik";

import { EmailType, EmailTypeButtons } from "@eisbuk/shared";
import { useTranslation, EmailTemplateLabel } from "@eisbuk/translations";
import { Button, ButtonColor } from "@eisbuk/ui";

import { capitalizeFirst, formatTemplateString } from "@/utils/helpers";

declare interface ButtonsProps {
  buttons: EmailTypeButtons;
  emailType: EmailType;
  input: MutableRefObject<HTMLInputElement | null>;
}
const Buttons: React.FC<ButtonsProps> = ({ buttons, emailType, input }) => {
  const { setFieldValue } = useFormikContext<any>();

  const { t } = useTranslation();

  const insertString = (buttonValue: string) => {
    if (input.current) {
      const [start, end] = [
        input.current.selectionStart,
        input.current.selectionEnd,
      ];
      const field = input.current.name.split(".")[1];

      if (start !== null && end !== null) {
        /** @TODO pass translated default click here messages?? */

        const inputValue = formatTemplateString(buttonValue);
        setFieldValue(
          `emailTemplates[${emailType}].[${field}]`,
          [
            input.current.value.slice(0, start),
            inputValue,
            input.current.value.slice(end),
          ].join("")
        );

        input.current.focus();
        input.current.selectionStart = input.current.selectionEnd = start;
      }
    }
  };

  return (
    <div className="flex pt-6 flex-wrap">
      {Object.values(buttons[emailType]).map((button) => (
        <Button
          key={button}
          color={ButtonColor.Primary}
          onClick={() => insertString(button as string)}
          type="button"
          className="mx-1 mb-1"
        >
          {t(EmailTemplateLabel[capitalizeFirst(button as string)])}
        </Button>
      ))}
    </div>
  );
};

export default Buttons;
