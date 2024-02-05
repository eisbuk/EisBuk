import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";

import {
  defaultEmailTemplates as emailTemplates,
  OrganizationData,
  ClientMessageMethod,
  CustomerFull,
} from "@eisbuk/shared";
import i18n, {
  ActionButton,
  DateFormat,
  useTranslation,
} from "@eisbuk/translations";
import { Button, ButtonColor, ButtonSize, LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";

import ErrorBoundary from "@/components/atoms/ErrorBoundary";

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
  const nonDeletedCustomers = useSelector(getCustomersList(true)).filter(
    (cus) => !cus.deleted
  );
  const calendarDay = useSelector(getCalendarDay);
  const organization = useSelector(getOrganizationSettings);
  const { t } = useTranslation();

  const allCustomerIds = nonDeletedCustomers.map((cus) => cus.id);
  // eslint-disable-next-line func-call-spacing
  const [localSetSubmitting, setLocalSetSubmitting] = useState<
    (isSubmitting: boolean) => void
  >(() => {});
  const [updatedEmailTemplate, setUpdatedEmailTemplate] =
    useState<OrganizationData["emailTemplates"]>(emailTemplates);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerFull[]>(
    []
  );

  const {
    openWithProps: openBookingsLinkDialog,
    state,
    close,
  } = useBookingsLinkModal();

  const handleCheckboxChange = (customer: CustomerFull) => {
    const customerIndex = selectedCustomerIds.indexOf(customer.id);

    if (customerIndex === -1) {
      // Item doesn't exist, add it to the array
      setSelectedCustomerIds([...selectedCustomerIds, customer.id]);
      setSelectedCustomers([...selectedCustomers, customer]);
    } else {
      // Item exists, remove it from the array
      const updatedCustomerIds = [...selectedCustomerIds].filter(
        (id) => id !== customer.id
      );
      const updatedCustomers = [...selectedCustomers].filter(
        (cus) => cus.id !== customer.id
      );
      setSelectedCustomerIds(updatedCustomerIds);
      setSelectedCustomers(updatedCustomers);
    }
  };

  const dispatch = useDispatch();

  const handleSubmit = (
    values: OrganizationData["emailTemplates"],
    actions: FormikHelpers<OrganizationData["emailTemplates"]>
  ) => {
    setUpdatedEmailTemplate(values);
    setLocalSetSubmitting(() => actions.setSubmitting);
    openBookingsLinkDialog({
      customers: selectedCustomers,
      submitting: false,
      action: "open",
    });
  };

  const handleConfirm = () => {
    const monthDeadline = i18n.t(DateFormat.Deadline, {
      date: getMonthDeadline(calendarDay),
    });
    localSetSubmitting(true);

    dispatch(
      updateOrganizationEmailTemplates(updatedEmailTemplate, localSetSubmitting)
    );

    selectedCustomers.forEach((customer) => {
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

  const handleCancel = () => {
    localSetSubmitting(false);
    close();
  };

  const handleSelectAll = () => {
    setSelectedCustomerIds(allCustomerIds);
    setSelectedCustomers(nonDeletedCustomers);
  };
  const handleClearAll = () => {
    setSelectedCustomerIds([]);
    setSelectedCustomers([]);
  };

  useEffect(() => {
    state &&
      state.props &&
      state.props.submitting &&
      (state.props.action === "confirm" ? handleConfirm() : handleCancel());
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
                      !selectedCustomerIds.length ||
                      isSubmitting ||
                      isValidating
                    }
                    color={ButtonColor.Primary}
                    size={ButtonSize.MD}
                    aria-label={"save"}
                    type="submit"
                  >
                    {t(ActionButton.Send)}
                  </Button>
                </div>
              }
            >
              <ErrorBoundary resetKeys={[nonDeletedCustomers]}>
                <EmailTemplateSettings
                  onCheckboxChange={handleCheckboxChange}
                  customers={nonDeletedCustomers}
                  selectedCustomerIds={selectedCustomerIds}
                  selectedCustomers={selectedCustomers}
                  onSelectAll={handleSelectAll}
                  onClearAll={handleClearAll}
                />
              </ErrorBoundary>
            </LayoutContent>
          </>
        )}
      </Formik>
    </Layout>
  );
};

const useBookingsLinkModal = createModal("SendBulkBookingsLinkDialog");

export default SendBookingEmails;
