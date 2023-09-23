import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useHistory, Redirect } from "react-router-dom";

import {
  CustomerForm,
  FormButton,
  FormButtonColor,
  LayoutContent,
} from "@eisbuk/ui";
import {
  ClientMessageMethod,
  Customer,
  CustomerLoose,
  OrgSubCollection,
} from "@eisbuk/shared";
import { PrivateRoutes, Routes } from "@eisbuk/shared/ui";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";
import { Phone, Calendar, Mail } from "@eisbuk/svg";
import { ActionButton, useTranslation } from "@eisbuk/translations";

import Layout from "@/controllers/Layout";

import { getCustomerById, getCustomersList } from "@/store/selectors/customers";

import { getOrganization } from "@/lib/getters";

import { createModal } from "@/features/modal/useModal";

import { updateCustomer } from "@/store/actions/customerOperations";

import { getNewSubscriptionNumber } from "../customers/utils";

// #region MainComponent
const AthleteProfilePage: React.FC = () => {
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Customers },
  ]);
  const dispatch = useDispatch();
  const history = useHistory();

  const { openWithProps: openDeleteCustomerDialog } = useDeleteCustomer();
  const { openWithProps: openExtendDateDialog } = useExtendDateModal();

  const customers = useSelector(getCustomersList());
  // Get customer (if exists)
  const { athlete } = useParams<{ athlete?: string }>();
  const customer = useSelector(getCustomerById(athlete || ""));

  // If customer is deleted, redirect back to customers page
  if (customer && customer.deleted) {
    return <Redirect to={PrivateRoutes.Athletes} />;
  }

  // We need a next available (as default) subscription number for customer create mode
  const subscriptionNumber = getNewSubscriptionNumber(customers);

  const handleSave: Parameters<typeof CustomerForm.Admin>[0]["onSave"] = (
    customer
  ) => {
    dispatch(updateCustomer(customer as CustomerLoose));
  };

  return (
    <Layout>
      <LayoutContent>
        <div className="pt-[44px] px-[71px] pb-8 md:pt-[62px]">
          <CustomerForm.Admin
            onSave={handleSave}
            onClose={() => history.goBack()}
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
            additionalActions={
              customer && <ActionButtons customer={customer} />
            }
            subscriptionNumber={subscriptionNumber}
          />
        </div>
      </LayoutContent>
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
  const sendBookingsLink = (method: ClientMessageMethod) => () => {
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
        onClick={sendBookingsLink(ClientMessageMethod.Email)}
        disabled={!hasEmail}
        color={FormButtonColor.Cyan}
        startAdornment={<Mail />}
      >
        {t(ActionButton.SendBookingsEmail)}
      </FormButton>
      <FormButton
        onClick={sendBookingsLink(ClientMessageMethod.SMS)}
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
