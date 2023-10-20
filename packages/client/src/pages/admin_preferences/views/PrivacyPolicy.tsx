import React from "react";
import { useFormikContext } from "formik";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ReactMarkdown from "react-markdown";

import {
  FormField,
  FormFieldVariant,
  FormSection,
  PrivacyPolicyToast,
} from "@eisbuk/ui";
import { MessageTemplateLabel, useTranslation } from "@eisbuk/translations";
import { OrganizationData } from "@eisbuk/shared";

const EmailTemplateSettings: React.FC = () => {
  const { t } = useTranslation();

  const {
    values: {
      privacyPolicy: { policy, ...privacyPolicyPrompt },
    },
  } = useFormikContext<Required<OrganizationData>>();

  return (
    <div className="pb-8 pt-24">
      <FormSection title="Compliance prompt">
        <div className="col-span-6 md:col-span-8">
          <FormField
            label="Prompt"
            variant={FormFieldVariant.Text}
            name="privacyPolicy.prompt"
          />
        </div>
        <div className="col-span-3 md:col-span-4 md:row-start-2">
          <FormField
            label="Learn more label"
            variant={FormFieldVariant.Text}
            name="privacyPolicy.learnMoreLabel"
          />
        </div>
        <div className="col-span-3 md:col-span-4 md:row-start-2">
          <FormField
            label="Accept label"
            variant={FormFieldVariant.Text}
            name="privacyPolicy.acceptLabel"
          />
        </div>
        <figure className="col-span-6 md:col-span-8 mb-20">
          <figcaption>Preview</figcaption>
          <PrivacyPolicyToast policyParams={privacyPolicyPrompt} />
        </figure>
      </FormSection>

      <div className="grid gap-x-10 grid-cols-6 lg:grid-cols-12"></div>

      <div className="col-span-6">
        <FormField
          label="Policy"
          variant={FormFieldVariant.Text}
          multiline={true}
          name="privacyPolicy.policy"
          rows={8}
        />
      </div>

      <div className="col-span-6 min-h-[60px] rounded-md shadow-[1px_1px_4px_-2px_#000000] p-4">
        <h3 className="text-cyan-700 font-bold text-lg mb-4">
          {t(MessageTemplateLabel.Preview)}
        </h3>
        <ReactMarkdown className="privacy-policy-md">{policy}</ReactMarkdown>
      </div>
    </div>
  );
};

export default EmailTemplateSettings;
