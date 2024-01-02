import React from "react";
import { DateTime } from "luxon";
import { useDispatch } from "react-redux";
import { FormikHelpers } from "formik";

import {
  Customer,
  ClientMessageMethod,
  OrganizationData,
} from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { Prompt, ActionButton, DateFormat } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import {
  getBookingsLink,
  sendBookingsLink,
} from "../SendBookingsLinkDialog/utils";

import { updateOrganization } from "@/store/actions/organizationOperations";
import { getMonthDeadline } from "@/store/selectors/bookings";

type SendBulkBookingsLinkProps = BaseModalProps & { customers: Customer[] } & {
  method: ClientMessageMethod;
  orgData: OrganizationData;
  actions: FormikHelpers<OrganizationData>;
  calendarDay: DateTime;
};

const SendBulkBookingsLinkDialog: React.FC<SendBulkBookingsLinkProps> = ({
  onClose,
  className,
  method,
  customers,
  orgData,
  actions,
  calendarDay,
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    const monthDeadline = i18n.t(DateFormat.Deadline, {
      date: getMonthDeadline(calendarDay),
    });

    dispatch(updateOrganization(orgData, actions.setSubmitting));
    customers.forEach((customer) => {
      dispatch(
        sendBookingsLink({
          ...customer,
          method,
          bookingsLink: getBookingsLink(customer.secretKey),
          deadline: monthDeadline,
        })
      );
    });
    onClose();
  };
  const onCancel = () => {
    actions.setSubmitting(false);
    onClose();
  };
  const checkEmails = (customers: Customer[]) => {
    const customersLength = customers.length.toString();
    return customers.some((cus) => !cus.email)
      ? {
          title: i18n.t(Prompt.NoBulkEmailTitle),
          body: i18n.t(Prompt.NoBulkEmailMessage),
          disabled: true,
        }
      : {
          title: i18n.t(Prompt.SendBulkEmailTitle),
          body: i18n.t(Prompt.SendBulkEmailMessage, {
            athletesNumber: customersLength,
          }),
          disabled: false,
        };
  };

  const { title, body, disabled } = checkEmails(customers);

  return (
    <ActionDialog
      onCancel={onCancel}
      {...{
        title,
        onConfirm,
        className,
        disabled,
      }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Send)}
    >
      {body}
    </ActionDialog>
  );
};

export default SendBulkBookingsLinkDialog;
