import React from "react";
import { useFormikContext } from "formik";

import { useTranslation, EmailTemplateLabel } from "@eisbuk/translations";

import { Button, ButtonColor, FormField, FormFieldVariant } from "@eisbuk/ui";
import { interpolateText, OrganizationData } from "@eisbuk/shared";

interface ButtonAttributes {
  label: EmailTemplateLabel;
  value: string;
}

interface Props {
  name: string;
  buttons: ButtonAttributes[];
}

const TemplateBlock: React.FC<Props> = ({ name, buttons }) => {
  const { t } = useTranslation();

  const {
    values: { emailTemplates },
    setFieldValue,
  } = useFormikContext<OrganizationData>();

  const input = React.useRef<HTMLInputElement | null>(null);

  const insertValuePlaceholder = (buttonValue: string) => () => {
    if (!input.current) return;

    const selection = getInputSelection(input.current);
    if (!selection) return;

    const [start, end] = selection;

    const { name, value } = input.current;

    // Format the button value - add anchor tag to links, where aplicable
    const inputValue = formatValuePlaceholder(buttonValue);

    const updatedValue = stringInsert(value, start, end, inputValue);

    setFieldValue(name, updatedValue);

    input.current.focus();
    input.current.selectionStart = input.current.selectionEnd = start;
  };

  return (
    <div className="pb-8 pt-24 border-b-2">
      <h2 className="text-xl mb-5 text-cyan-800 font-bold">
        {t(EmailTemplateLabel[name])}
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
              <FormField
                label={t(EmailTemplateLabel.Subject)}
                variant={FormFieldVariant.Text}
                name={`emailTemplates[${name}].subject`}
                innerRef={input}
                onFocus={(e) => (input.current = e.target)}
              />
              <FormField
                label={t(EmailTemplateLabel.HTML)}
                variant={FormFieldVariant.Text}
                multiline={true}
                name={`emailTemplates[${name}].html`}
                rows={8}
                innerRef={input}
                onFocus={(e) => (input.current = e.target)}
              />
            </div>
          </div>
        </div>

        <div className="col-span-6">
          <div className="col-span-1 md:col-span-2 min-h-[60px] rounded-md shadow-[1px_1px_4px_-2px_#000000] p-4">
            <h3 className="text-cyan-700 font-bold text-lg mb-4">Preview</h3>
            <div className="mb-4 flex gap-2">
              <h4 className="text-black font-bold">Subject:</h4>
              <span
                dangerouslySetInnerHTML={{
                  __html: applyStylingToLinks(
                    interpolateText(
                      emailTemplates[name].subject,
                      previewDefaults
                    )
                  ),
                }}
              />
            </div>

            <div className="mb-4 flex gap-2">
              <h4 className="text-black font-bold">Text:</h4>
              <p
                dangerouslySetInnerHTML={{
                  __html: applyStylingToLinks(
                    interpolateText(emailTemplates[name].html, previewDefaults)
                  ),
                }}
                className="outline-gray-300 outline-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const previewDefaults = {
  organizationName: "Organization Name",
  name: "Saul",
  surname: "Goodman",
  bookingsLink: "https://ice.it/saul",
  bookingsMonth: "April",
  extendedBookingsDate: "06/04",
  icsFile: "icsFile.ics",
};

const stringInsert = (
  string: string,
  start: number,
  end: number,
  value: string
) => [string.slice(0, start), value, string.slice(end)].join("");

const getInputSelection = (input: HTMLInputElement) =>
  input.selectionStart && input.selectionEnd
    ? [input.selectionStart, input.selectionEnd]
    : null;

const applyStylingToLinks = (html: string) =>
  html.replace(/<a/, (s) => `${s} style="color: blue"`);

export const formatValuePlaceholder = (value: string) => {
  switch (value) {
    case "icsFile":
      return '<a href="{{ icsFile }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>';
    case "bookingsLink":
      return '<a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>';
    default:
      return `{{ ${value} }}`;
  }
};

export default TemplateBlock;
