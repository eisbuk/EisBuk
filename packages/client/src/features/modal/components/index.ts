import Modal, { ModalContainer } from "./Modal";

import CancelBookingDialog from "./CancelBookingDialog";
import FinalizeBookingsDialog from "./FinalizeBookingsDialog";
import SendBookingsLinkDialog from "./SendBookingsLinkDialog";
import DeleteCustomerDialog from "./DeleteCustomerDialog";
import ExtendBookingDateDialog from "./ExtendBookingDateDialog";
import DeleteSlotDialog from "./DeleteSlotDialog";
import AddAttendedCustomersDialog from "./AddAttendedCustomersDialog";
import SlotForm from "@/components/atoms/SlotForm";
import BirthdayDialog from "@/components/atoms/BirthdayMenu/BirthdayDialog";
import CustomerCard from "@/components/atoms/CustomerCard";

/**
 * A whitelist of components to be renderd inside of modal.
 */
export const componentWhitelist = {
  CancelBookingDialog,
  FinalizeBookingsDialog,
  SendBookingsLinkDialog,
  DeleteCustomerDialog,
  ExtendBookingDateDialog,
  DeleteSlotDialog,
  AddAttendedCustomersDialog,
  BirthdayDialog,
  SlotForm,
  CustomerCard,
};

export { Modal, ModalContainer };
