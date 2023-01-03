import React from "react";
import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useHistory } from "react-router-dom";

import { CustomerForm, Layout, FormButton, FormButtonColor } from "@eisbuk/ui";
import { Customer, CustomerLoose, OrgSubCollection } from "@eisbuk/shared";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";
import { Phone, Calendar, Mail } from "@eisbuk/svg";
import { ActionButton, useTranslation } from "@eisbuk/translations";

import { SendBookingLinkMethod } from "@/enums/other";
import { PrivateRoutes, Routes } from "@/enums/routes";

import { NotificationsContainer } from "@/features/notifications/components";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";

import {
  getCustomerById,
  getCustomersByBirthday,
  getCustomersList,
} from "@/store/selectors/customers";

import { getOrganization } from "@/lib/getters";

import { createModal } from "@/features/modal/useModal";

import { updateCustomer } from "@/store/actions/customerOperations";

import { getNewSubscriptionNumber } from "../customers/utils";

import { adminLinks } from "@/data/navigation";

// #region MainComponent
const AthleteProfilePage: React.FC = () => {
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Customers },
  ]);
  const dispatch = useDispatch();
  const history = useHistory();

  const { openWithProps: openDeleteCustomerDialog } = useDeleteCustomer();
  const { openWithProps: openExtendDateDialog } = useExtendDateModal();

  // Layout content
  const customers = useSelector(getCustomersList());
  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  // Get customer (if exists)
  const { athlete } = useParams<{ athlete?: string }>();
  const customer = useSelector(getCustomerById(athlete || ""));

  // If customer is deleted, redirect back to customers page
  if (customer && customer.deleted) {
    history.push(PrivateRoutes.Athletes);
  }

  // We need a next available (as default) subscription number for customer create mode
  const subscriptionNumber = getNewSubscriptionNumber(customers);

  const handleSave: Parameters<typeof CustomerForm.Admin>[0]["onSave"] = (
    customer
  ) => {
    dispatch(updateCustomer(customer as CustomerLoose));
  };

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <div className="content-container pt-[44px] px-[71px] pb-8 md:pt-[62px]">
        <CustomerForm.Admin
          onSave={handleSave}
          onClose={() => history.push(PrivateRoutes.Athletes)}
          onDelete={() => {
            if (customer) {
              openDeleteCustomerDialog(customer);
            }
          }}
          onBookingDateExtended={(extendedDate) => {
            if (customer) {
              openExtendDateDialog({ ...customer, extendedDate });
            }
          }}
          customer={customer}
          additionalActions={customer && <ActionButtons customer={customer} />}
          subscriptionNumber={subscriptionNumber}
        />
      </div>
    </Layout>
  );
};
// #endregion MainComponent

// #region ActionButtons
interface ActionButtonsProps {
  customer: Customer;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ customer }) => {
  const { t } = useTranslation();
  const { openWithProps: openBookingsLinkDialog } = useBookingsLinkModal();

  const hasPhone = Boolean(customer.phone);
  const hasEmail = Boolean(customer.email);
  const sendBookingsLink = (method: SendBookingLinkMethod) => () => {
    openBookingsLinkDialog({
      ...customer,
      method,
    });
  };

  return (
    <div className="flex flex-wrap my-8 justify-start items-center gap-2">
      <Link to={`${Routes.CustomerArea}/${customer.secretKey}`}>
        <FormButton color={FormButtonColor.Cyan} startAdornment={<Calendar />}>
          {t(ActionButton.CustomerBookings)}
        </FormButton>
      </Link>
      <FormButton
        onClick={sendBookingsLink(SendBookingLinkMethod.Email)}
        disabled={!hasEmail}
        color={FormButtonColor.Cyan}
        startAdornment={<Mail />}
      >
        {t(ActionButton.SendBookingsEmail)}
      </FormButton>
      <FormButton
        onClick={sendBookingsLink(SendBookingLinkMethod.SMS)}
        disabled={!hasPhone}
        color={FormButtonColor.Cyan}
        startAdornment={<Phone />}
      >
        {t(ActionButton.SendBookingsSMS)}
      </FormButton>
    </div>
  );
};

const useExtendDateModal = createModal("ExtendBookingDateDialog");

const useDeleteCustomer = createModal("DeleteCustomerDialog");

const useBookingsLinkModal = createModal("SendBookingsLinkDialog");
// #endregion ActionButtons

export default AthleteProfilePage;
