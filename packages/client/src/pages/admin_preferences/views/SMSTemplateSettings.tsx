import { useFormikContext } from "formik";
import React from "react";
import { useSelector } from "react-redux";

import { FormField, FormFieldVariant } from "@eisbuk/ui";
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
      {organization.smsTemplates &&
        Object.keys(organization.smsTemplates)
          .sort((a, b) => (a < b ? -1 : 1))
          .map((name) => (
            <TemplateBlock
              type="smsTemplates"
              name={name}
              buttons={buttons[name]}
              TemplateFields={TemplateFields}
              PreviewFields={PreviewFields}
            />
          ))}
    </div>
  );
};

const TemplateFields: TemplateFieldsInterface = ({ input, name }) => {
  return (
    <FormField
      label="Template"
      variant={FormFieldVariant.Text}
      name={`smsTemplates[${name}]`}
      multiline={true}
      rows={8}
      innerRef={input}
      onFocus={(e) => (input.current = e.target)}
    />
  );
};

const PreviewFields: PreviewFieldsInterface = ({ name }) => {
  const {
    values: {
      smsTemplates: { [name]: template },
    },
  } = useFormikContext<OrganizationData>();

  return (
    <p
      dangerouslySetInnerHTML={{
        __html: formatPreview(interpolateText(template, previewValues)),
      }}
      className="outline-gray-300 outline-1 whitespace-pre"
    />
  );
};

/**
 * Since SMS can't be formatted using HTML, here we're formatting the plain text
 * into HTML and wrapping links with anchor tag (and painting them to blue) for preview purposes
 */
const formatPreview = (text: string) =>
  text.replaceAll(
    /http[^ ]* /g,
    (s) => `<a style="color: blue" href="${s}">${s}</a>`
  );

export default EmailTemplateSettings;
