import React from "react";
import { useFormikContext } from "formik";

import { useTranslation, MessageTemplateLabel } from "@eisbuk/translations";
import { Button, ButtonColor } from "@eisbuk/ui";
import { OrganizationData } from "@eisbuk/shared";

interface ButtonAttributes {
  label: MessageTemplateLabel;
  value: string;
}

export type TemplateFieldsInterface = React.FC<{
  name: string;
  input: React.MutableRefObject<HTMLInputElement | null>;
}>;
export type PreviewFieldsInterface = React.FC<{
  name: string;
}>;

interface Props {
  name: string;
  buttons: ButtonAttributes[];
  // This is just a rich way of ensuring our type is in fact a
  // subset of organization data field names
  type: keyof Pick<OrganizationData, "emailTemplates" | "smsTemplates">;
  TemplateFields: TemplateFieldsInterface;
  PreviewFields: PreviewFieldsInterface;
}

const TemplateBlock: React.FC<Props> = ({
  name,
  buttons,
  type,
  TemplateFields,
  PreviewFields,
}) => {
  const { t } = useTranslation();

  const { setFieldValue } = useFormikContext<OrganizationData>();

  const input = React.useRef<HTMLInputElement | null>(null);

  const insertValuePlaceholder = (buttonValue: string) => () => {
    if (!input.current) return;

    const [start, end] = getInputSelection(input.current);

    const { name, value } = input.current;

    const inputValue =
      // Format the placeholder value, add anchor tag to links, where aplicable
      formatValuePlaceholder(buttonValue, type === "emailTemplates");

    const updatedValue = stringInsert(value, start, end, inputValue);

    setFieldValue(name, updatedValue);

    input.current.focus();
    // Set selection to the end of the inserted value, after the field has been focused (hence the timeout)
    const cursorPosition = start + inputValue.length;
    const setSelection = () =>
      input.current?.setSelectionRange(cursorPosition, cursorPosition);
    setTimeout(setSelection, 5);
  };

  return (
    <div className="pb-8 pt-24 border-b-2">
      <h2 className="text-xl mb-5 text-cyan-800 font-bold">
        {t(MessageTemplateLabel[name])}
      </h2>
      <div key={name} className="grid gap-x-10 grid-cols-6 lg:grid-cols-12">
        <div className="col-span-6">
          <div className="flex-row">
            <div className="flex pt-6 flex-wrap">
              {buttons.map(({ value, label }) => (
                <Button
                  key={value}
                  color={ButtonColor.Primary}
                  onClick={insertValuePlaceholder(value)}
                  type="button"
                  className="mx-1 mb-1"
                >
                  {t(label)}
                </Button>
              ))}
            </div>

            <div className="py-4 border-gray-300">
              <TemplateFields name={name} input={input} />
            </div>
          </div>
        </div>

        <div className="col-span-6">
          <div className="col-span-1 md:col-span-2 min-h-[60px] rounded-md shadow-[1px_1px_4px_-2px_#000000] p-4">
            <h3 className="text-cyan-700 font-bold text-lg mb-4">
              {t(MessageTemplateLabel.Preview)}
            </h3>
            <PreviewFields name={name} />
          </div>
        </div>
      </div>
    </div>
  );
};

const stringInsert = (
  string: string,
  start: number,
  end: number,
  value: string
) => [string.slice(0, start), value, string.slice(end)].join("");

const getInputSelection = (input: HTMLInputElement) => [
  input.selectionStart || 0,
  input.selectionEnd || 0,
];

const formatValuePlaceholder = (value: string, wrapLinks: boolean) => {
  switch (value) {
    case "icsFile":
      if (wrapLinks) {
        return '<a href="{{ icsFile }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>';
      }
    // eslint-disable-next-line no-fallthrough
    case "bookingsLink":
      if (wrapLinks) {
        return '<a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>';
      }
    // eslint-disable-next-line no-fallthrough
    default:
      return `{{ ${value} }}`;
  }
};

export default TemplateBlock;
