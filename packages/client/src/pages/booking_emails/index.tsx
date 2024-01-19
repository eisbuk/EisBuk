import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";

import {
  defaultEmailTemplates as emailTemplates,
  OrganizationData,
  ClientMessageMethod,
} from "@eisbuk/shared";
import { ActionButton, useTranslation } from "@eisbuk/translations";
import { Button, ButtonColor, ButtonSize, LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";

import { getCalendarDay, getOrganizationSettings } from "@/store/selectors/app";
import { getCustomersList } from "@/store/selectors/customers";

import EmailTemplateSettings from "./EmailTemplateSettings";
import { createModal } from "@/features/modal/useModal";

const SendBookingEmails: React.FC = () => {
  const allCustomers = useSelector(getCustomersList(true));
  const calendarDay = useSelector(getCalendarDay);
  const allCustomerIds = allCustomers.map((cus) => cus.id);
  const { openWithProps: openBookingsLinkDialog } = useBookingsLinkModal();

  const organization = useSelector(getOrganizationSettings);
  const { t } = useTranslation();

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const handleCheckboxChange = (customerId: string) => {
    const customerIndex = selectedCustomers.indexOf(customerId);

    if (customerIndex === -1) {
      // Item doesn't exist, add it to the array
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      // Item exists, remove it from the array
      const updatedCustomers = [...selectedCustomers].filter(
        (id) => id !== customerId
      );
      setSelectedCustomers(updatedCustomers);
    }
  };

  const handleSubmit = (
    updatedEmailTemplates: OrganizationData["emailTemplates"],
    actions: FormikHelpers<OrganizationData["emailTemplates"]>
  ) => {
    const customers = allCustomers.filter((cus) =>
      selectedCustomers.includes(cus.id)
    );

    openBookingsLinkDialog({
      customers,
      method: ClientMessageMethod.Email,
      emailTemplates: updatedEmailTemplates,
      actions,
      calendarDay,
    });
  };

  const initialValues = {
    ...emailTemplates,
    ...organization.emailTemplates,
  } as OrganizationData["emailTemplates"];

  return (
    <Layout>
      <Formik
        {...{ initialValues }}
        enableReinitialize={true}
        onSubmit={(values, actions) => handleSubmit(values, actions)}
      >
        {({ isSubmitting, isValidating, handleReset }) => (
          <>
            <LayoutContent
              Component={Form as any}
              actionButtons={
                <div className="py-2 flex justify-end items-center gap-2">
                  <Button
                    onClick={handleReset}
                    disabled={isSubmitting || isValidating}
                    className="!text-cyan-500"
                    size={ButtonSize.MD}
                  >
                    {t(ActionButton.Reset)}
                  </Button>
                  <Button
                    disabled={
                      !selectedCustomers.length || isSubmitting || isValidating
                    }
                    color={ButtonColor.Primary}
                    size={ButtonSize.MD}
                    aria-label={"save"}
                    type="submit"
                  >
                    {t(ActionButton.Save)}
                  </Button>
                </div>
              }
            >
              <EmailTemplateSettings
                onCheckboxChange={handleCheckboxChange}
                customers={allCustomers}
                selectedCustomers={selectedCustomers}
                onSelectAll={() => setSelectedCustomers(allCustomerIds)}
                onClearAll={() => setSelectedCustomers([])}
              />
            </LayoutContent>
          </>
        )}
      </Formik>
    </Layout>
  );
};

const useBookingsLinkModal = createModal("SendBulkBookingsLinkDialog");

export default SendBookingEmails;
