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
        __html: interpolateText(template, previewValues),
      }}
      className="outline-gray-300 outline-1"
    />
  );
};

export default EmailTemplateSettings;
