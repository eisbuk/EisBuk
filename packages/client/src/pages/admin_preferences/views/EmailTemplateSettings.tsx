import React from "react";
import { useSelector } from "react-redux";
import { useFormikContext } from "formik";

import { FormField, FormFieldVariant } from "@eisbuk/ui";
import { MessageTemplateLabel, useTranslation } from "@eisbuk/translations";
import { interpolateText, OrganizationData } from "@eisbuk/shared";

import { getOrganizationSettings } from "@/store/selectors/app";

import TemplateBlock, {
  PreviewFieldsInterface,
  TemplateFieldsInterface,
} from "../TemplateBlock";

import { buttons, previewValues } from "../data";

const EmailTemplateSettings: React.FC = () => {
  const organization = useSelector(getOrganizationSettings);

  return (
    <div>
      {organization.emailTemplates &&
        Object.keys(organization.emailTemplates)
          .sort((a, b) => (a < b ? -1 : 1))
          .map((name) => (
            <TemplateBlock
              type="emailTemplates"
              name={name}
              buttons={buttons[name]}
              TemplateFields={TemplateFields}
              PreviewFields={PreviewFields}
            />
          ))}
    </div>
  );
};

const TemplateFields: TemplateFieldsInterface = ({ name, input }) => {
  const { t } = useTranslation();

  return (
    <>
      <FormField
        label={t(MessageTemplateLabel.Subject)}
        variant={FormFieldVariant.Text}
        name={`emailTemplates[${name}].subject`}
        innerRef={input}
        onFocus={(e) => (input.current = e.target)}
      />
      <FormField
        label={t(MessageTemplateLabel.Body)}
        variant={FormFieldVariant.Text}
        multiline={true}
        name={`emailTemplates[${name}].html`}
        rows={8}
        innerRef={input}
        onFocus={(e) => (input.current = e.target)}
      />
    </>
  );
};

const PreviewFields: PreviewFieldsInterface = ({ name }) => {
  const {
    values: {
      emailTemplates: { [name]: template },
    },
  } = useFormikContext<OrganizationData>();

  return (
    <>
      <div className="mb-4 flex gap-2">
        <h4 className="text-black font-bold">Subject:</h4>
        <span
          dangerouslySetInnerHTML={{
            __html: applyStylingToLinks(
              interpolateText(template.subject, previewValues)
            ),
          }}
        />
      </div>

      <div className="mb-4 flex gap-2">
        <h4 className="text-black font-bold">Text:</h4>
        <p
          dangerouslySetInnerHTML={{
            __html: applyStylingToLinks(
              interpolateText(template.html, previewValues)
            ),
          }}
          className="outline-gray-300 outline-1"
        />
      </div>
    </>
  );
};

/** A simple function used to "override" the tailwind reset styles - explicitly display links as blue text */
const applyStylingToLinks = (html: string) =>
  html.replaceAll(/<a/g, (s) => `${s} style="color: blue"`);

export default EmailTemplateSettings;
