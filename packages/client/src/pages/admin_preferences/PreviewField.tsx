import React from "react";
import { useFormikContext } from "formik";
import { EmailTemplate, interpolateText } from "@eisbuk/shared";
import { FormField, FormFieldVariant } from "@eisbuk/ui";
import { useTranslation, EmailTemplateLabel } from "@eisbuk/translations";
import { replaceHTMLTags } from "@/utils/helpers";

export interface PreviewFieldProps {
  template: EmailTemplate;
  name: string;
}
const PreviewField: React.FC<PreviewFieldProps> = ({ name, ...props }) => {
  const {
    values: { emailTemplates },
    setFieldValue,
  } = useFormikContext<any>();

  const { t } = useTranslation();

  const preveiwDefaults = {
    organizationName: "Organization Name",
    name: "Saul",
    surname: "Goodman",
    bookingsLink: "someLink",
    bookingsMonth: "April",
    extendedBookingsDate: "02/01",
    icsFile: "icsFile.ics",
  };
  const subject = replaceHTMLTags(emailTemplates[name].subject);
  const html = replaceHTMLTags(emailTemplates[name].html);
  React.useEffect(() => {
    if (emailTemplates[name].subject.trim() !== "") {
      setFieldValue(
        `${name}-subject-preview`,
        `${interpolateText(subject, preveiwDefaults)}`
      );
    }
  }, [emailTemplates[name].subject, setFieldValue, name]);

  React.useEffect(() => {
    if (emailTemplates[name].html.trim() !== "") {
      setFieldValue(
        `${name}-html-preview`,
        `${interpolateText(html, {
          organizationName: "Organization Name",
          name: "Saul",
          surname: "Goodman",
          bookingsLink: "https://eisbuk.it/saul",
          bookingsMonth: "April",
          extendedBookingsDate: "06/04",
          icsFile: "icsFile.ics",
        })}`
      );
    }
  }, [emailTemplates[name].html, setFieldValue, name]);

  return (
    <div className="col-span-1 md:col-span-2 min-h-[60px]">
      <FormField
        label={t(EmailTemplateLabel.SubjectPreview)}
        variant={FormFieldVariant.Text}
        multiline={true}
        disabled={true}
        name={`${name}-subject-preview`}
        containerClassName="outline-gray-300 outline-1 shadow-sm"
        inputClassName="bg-gray-100"
        {...props}
      />
      <FormField
        label={t(EmailTemplateLabel.HTMLPreview)}
        variant={FormFieldVariant.Text}
        multiline={true}
        disabled={true}
        rows={8}
        name={`${name}-html-preview`}
        containerClassName="outline-gray-300 outline-1 shadow-sm"
        inputClassName="bg-gray-100"
        {...props}
      />
    </div>
  );
};

export default PreviewField;
