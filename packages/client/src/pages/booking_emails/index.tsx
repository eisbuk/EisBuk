import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";

import {
  defaultEmailTemplates as emailTemplates,
  OrganizationData,
  ClientMessageMethod,
} from "@eisbuk/shared";
import i18n, {
  ActionButton,
  DateFormat,
  useTranslation,
} from "@eisbuk/translations";
import { Button, ButtonColor, ButtonSize, LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";

import { getCalendarDay, getOrganizationSettings } from "@/store/selectors/app";
import { getCustomersList } from "@/store/selectors/customers";

import EmailTemplateSettings from "./EmailTemplateSettings";
import { createModal } from "@/features/modal/useModal";
import { getMonthDeadline } from "@/store/selectors/bookings";
import {
  sendBookingsLink,
  getBookingsLink,
} from "@/features/modal/components/SendBookingsLinkDialog/utils";
import { updateOrganizationEmailTemplates } from "@/store/actions/organizationOperations";

const SendBookingEmails: React.FC = () => {
  const allCustomers = useSelector(getCustomersList(true));
  const calendarDay = useSelector(getCalendarDay);
  const organization = useSelector(getOrganizationSettings);
  const { t } = useTranslation();

  const allCustomerIds = allCustomers.map((cus) => cus.id);
  // eslint-disable-next-line func-call-spacing
  const [localSetSubmitting, setLocalSetSubmitting] = useState<
    (isSubmitting: boolean) => void
  >(() => {});
  const [updatedEmailTemplate, setUpdatedEmailTemplate] =
    useState<OrganizationData["emailTemplates"]>(emailTemplates);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const {
    openWithProps: openBookingsLinkDialog,
    state,
    close,
  } = useBookingsLinkModal();

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

  const dispatch = useDispatch();

  const handleSubmit = (
    values: OrganizationData["emailTemplates"],
    actions: FormikHelpers<OrganizationData["emailTemplates"]>
  ) => {
    const customers = allCustomers.filter((cus) =>
      selectedCustomers.includes(cus.id)
    );
    setUpdatedEmailTemplate(values);
    setLocalSetSubmitting(() => actions.setSubmitting);
    openBookingsLinkDialog({
      customers,
      submitting: false,
      action: "open",
    });
  };

  const onConfirm = () => {
    const customers = allCustomers.filter((cus) =>
      selectedCustomers.includes(cus.id)
    );

    const monthDeadline = i18n.t(DateFormat.Deadline, {
      date: getMonthDeadline(calendarDay),
    });
    localSetSubmitting(true);

    dispatch(
      updateOrganizationEmailTemplates(updatedEmailTemplate, localSetSubmitting)
    );

    customers.forEach((customer) => {
      dispatch(
        sendBookingsLink({
          ...customer,
          method: ClientMessageMethod.Email,
          bookingsLink: getBookingsLink(customer.secretKey),
          deadline: monthDeadline,
        })
      );
    });
    close();
    localSetSubmitting(false);
  };

  const onCancel = () => {
    localSetSubmitting(false);
    close();
  };

  useEffect(() => {
    state &&
      state.props &&
      state.props.submitting &&
      (state.props.action === "confirm" ? onConfirm() : onCancel());
  }, [state]);

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
