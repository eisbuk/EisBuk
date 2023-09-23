import React from "react";
import { useSelector } from "react-redux";

import { getOrganizationSettings } from "@/store/selectors/app";

import TemplateBlock from "../TemplateBlock";

import { buttons } from "../data";

const EmailTemplateSettings: React.FC = () => {
  const organization = useSelector(getOrganizationSettings);

  return (
    <div>
      {organization.smsTemplates &&
        Object.keys(organization.smsTemplates).map((name) => (
          <TemplateBlock
            type="smsTemplates"
            name={name}
            buttons={buttons[name]}
          />
        ))}
    </div>
  );
};

export default EmailTemplateSettings;
