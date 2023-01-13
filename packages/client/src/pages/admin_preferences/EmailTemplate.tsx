import React, { MutableRefObject } from "react";

import { FormField, FormFieldVariant } from "@eisbuk/ui";
import { useTranslation, EmailTemplateLabel } from "@eisbuk/translations";

export interface EmailTemplateFieldProps {
  label: string;
  input: MutableRefObject<HTMLInputElement | null>;
}

const EmailTemplate: React.FC<EmailTemplateFieldProps> = ({
  input,
  label,
  ...rest
}) => {
  const { t } = useTranslation();
  return (
    <div className="py-4 border-gray-300">
      <FormField
        label={t(EmailTemplateLabel.Subject)}
        variant={FormFieldVariant.Text}
        name={`emailTemplates[${label}].subject`}
        innerRef={input}
        onFocus={(e) => (input.current = e.target)}
        {...rest}
      />
      <FormField
        label={t(EmailTemplateLabel.HTML)}
        variant={FormFieldVariant.Text}
        multiline={true}
        name={`emailTemplates[${label}].html`}
        rows={8}
        innerRef={input}
        onFocus={(e) => (input.current = e.target)}
        {...rest}
      />
    </div>
  );
};

export default EmailTemplate;
