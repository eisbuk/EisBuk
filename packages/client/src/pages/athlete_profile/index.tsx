import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useHistory, Redirect } from "react-router-dom";

import {
  CustomerForm,
  FormButton,
  FormButtonColor,
  ButtonIcon,
  LayoutContent,
} from "@eisbuk/ui";
import {
  ClientMessageMethod,
  Customer,
  CustomerLoose,
  OrgSubCollection,
} from "@eisbuk/shared";
import { getDefaultCountryCode } from "@/store/selectors/orgInfo";

import { PrivateRoutes, Routes } from "@eisbuk/shared/ui";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";
import { Phone, Calendar, Mail } from "@eisbuk/svg";
import { ActionButton, useTranslation } from "@eisbuk/translations";

import AdminBar from "@/controllers/AdminBar";
import { NotificationsContainer } from "@/features/notifications/components/index";

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
  const defaultCountryCode = useSelector(getDefaultCountryCode);

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
    <div className="absolute top-0 right-0 left-0 flex flex-col pb-[70px] pt-[72px] md:pt-[272px] md:pb-0">
      <header className="fixed left-0 top-0 right-0 bg-gray-800 z-50">
        <div className="content-container">
          <AdminBar className="flex w-full h-[70px] py-[15px] justify-between items-center print:hidden" />

          <div className="hidden w-full h-[70px] py-[15px] justify-between items-center md:flex print:hidden">
            <div>{null}</div>
            {null}
          </div>

          <div className="w-full h-[2px] bg-gray-700" />

          <div className="hidden w-full h-[70px] justify-between items-center md:flex print:hidden">
            <div className="w-full flex items-center gap-3 justify-start max-w-1/2">
              {null}
            </div>

            <div className="hidden md:block md:w-full">
              <NotificationsContainer className="w-full md:w-auto" />
            </div>
          </div>
        </div>
      </header>

      <LayoutContent>
        <div className="pt-[44px] px-[71px] pb-8 md:pt-[62px]">
          <CustomerForm.Admin
            defaultDialCode={defaultCountryCode}
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

        <div className="fixed px-4 bottom-4 right-0 z-40 md:hidden">
          <NotificationsContainer />
        </div>
      </LayoutContent>
    </div>
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
        <FormButton
          color={FormButtonColor.Cyan}
          startAdornment={<ButtonIcon I={Calendar} />}
        >
          {t(ActionButton.CustomerBookings)}
        </FormButton>
      </Link>
      <FormButton
        onClick={sendBookingsLink(ClientMessageMethod.Email)}
        disabled={!hasEmail}
        color={FormButtonColor.Cyan}
        startAdornment={<ButtonIcon I={Mail} />}
      >
        {t(ActionButton.SendBookingsEmail)}
      </FormButton>
      <FormButton
        onClick={sendBookingsLink(ClientMessageMethod.SMS)}
        disabled={!hasPhone}
        color={FormButtonColor.Cyan}
        startAdornment={<ButtonIcon I={Phone} />}
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
