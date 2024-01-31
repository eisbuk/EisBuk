import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useFormikContext } from "formik";

import {
  Button,
  ButtonColor,
  CheckboxCustomerList,
  FormField,
  FormFieldVariant,
} from "@eisbuk/ui";
import { MessageTemplateLabel, useTranslation } from "@eisbuk/translations";
import {
  interpolateText,
  OrganizationData,
  ClientMessageType,
  CustomerFull,
} from "@eisbuk/shared";
import { ChevronDown } from "@eisbuk/svg";
import { useClickOutside } from "@eisbuk/shared/ui";
import { testId } from "@eisbuk/testing/testIds";

import { getCalendarDay, getOrganizationSettings } from "@/store/selectors/app";

import { getMonthStr, insertValuePlaceholder } from "@/utils/helpers";

import {
  PreviewFieldsInterface,
  TemplateFieldsInterface,
} from "../admin_preferences/TemplateBlock";

import { buttons, previewValues } from "../admin_preferences/data";

interface EmailTemplateSettingsProps {
  onCheckboxChange: (customer: CustomerFull) => void;
  customers: CustomerFull[];
  selectedCustomerIds: string[];
  onSelectAll: () => void;
  onClearAll: () => void;
}
const EmailTemplateSettings: React.FC<EmailTemplateSettingsProps> = ({
  onCheckboxChange,
  customers,
  selectedCustomerIds,
  onSelectAll,
  onClearAll,
}) => {
  const organization = useSelector(getOrganizationSettings);

  const { t } = useTranslation();

  const calendarDay = useSelector(getCalendarDay);
  const monthStr = getMonthStr(calendarDay, 0);

  const { setFieldValue } = useFormikContext<OrganizationData>();

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const input = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const insertValuePlaceholderWithCtx = insertValuePlaceholder(
    setFieldValue,
    input,
    "emailTemplates"
  );

  useClickOutside(containerRef, () => setIsOpen(false));

  const name = ClientMessageType.SendBookingsLink;
  return (
    <div>
      {organization.emailTemplates &&
        organization.emailTemplates[ClientMessageType.SendBookingsLink] && (
          <div className="pb-8 pt-24 border-b-2">
            <h2 className="text-xl mb-5 text-cyan-800 font-bold">
              {t(MessageTemplateLabel[name])}
            </h2>

            <div ref={containerRef}>
              <div className="relative inline-block text-left">
                <span className="rounded-md shadow-sm">
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={toggleDropdown}
                    data-testid={testId("select-athletes")}
                  >
                    {t(MessageTemplateLabel.SelectAthletes)}
                    <span className="inline-block h-6 w-6">
                      <ChevronDown />
                    </span>
                  </button>
                </span>
              </div>
              <CheckboxCustomerList
                customers={customers}
                onCustomerClick={onCheckboxChange}
                selectedCustomerIds={selectedCustomerIds}
                isOpen={isOpen}
                onSelectAll={onSelectAll}
                onClearAll={onClearAll}
                monthStr={monthStr}
              />
            </div>
            <div
              key={name}
              className="grid gap-x-10 grid-cols-6 lg:grid-cols-12"
            >
              <div className="col-span-6">
                <div className="flex-row">
                  <div className="flex pt-6 flex-wrap">
                    {buttons[ClientMessageType.SendBookingsLink].map(
                      ({ value, label }) => (
                        <Button
                          key={value}
                          color={ButtonColor.Primary}
                          onClick={insertValuePlaceholderWithCtx(value)}
                          type="button"
                          className="mx-1 mb-1"
                        >
                          {t(label)}
                        </Button>
                      )
                    )}
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
        )}
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
        name={`${name}.subject`}
        innerRef={input}
        onFocus={(e) => (input.current = e.target)}
      />
      <FormField
        label={t(MessageTemplateLabel.Body)}
        variant={FormFieldVariant.Text}
        multiline={true}
        name={`${name}.html`}
        rows={8}
        innerRef={input}
        onFocus={(e) => (input.current = e.target)}
      />
    </>
  );
};

const PreviewFields: PreviewFieldsInterface = ({ name }) => {
  const {
    values: { [name]: template },
  } = useFormikContext<OrganizationData["emailTemplates"]>();

  return (
    <>
      <div className="mb-4 flex gap-2">
        <h4 className="text-black font-bold">Subject:</h4>
        <span
          dangerouslySetInnerHTML={{
            __html: formatPreview(
              interpolateText(template.subject, previewValues)
            ),
          }}
        />
      </div>

      <div className="mb-4 flex gap-2">
        <h4 className="text-black font-bold">Text:</h4>
        <p
          dangerouslySetInnerHTML={{
            __html: formatPreview(
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
const formatPreview = (html: string) =>
  html.replaceAll(/<a/g, (s) => `${s} style="color: blue"`);

export default EmailTemplateSettings;
