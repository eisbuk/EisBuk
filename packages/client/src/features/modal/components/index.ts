export { Modal, ModalContainer } from "./Modal";

import { BirthdayDialog } from "@eisbuk/ui";

import CancelBookingDialog from "./CancelBookingDialog";
import FinalizeBookingsDialog from "./FinalizeBookingsDialog";
import SendBookingsLinkDialog from "./SendBookingsLinkDialog";
import SendBulkBookingsLinkDialog from "./SendBulkBookingsLinkDialog";
import DeleteCustomerDialog from "./DeleteCustomerDialog";
import ExtendBookingDateDialog from "./ExtendBookingDateDialog";
import DeleteSlotDialog from "./DeleteSlotDialog";
import DeleteSlotDisabledDialog from "./DeleteSlotDisabledDialog";
import AddAttendedCustomersDialog from "./AddAttendedCustomersDialog";
import SlotFormDialog from "./SlotFormDialog";
import SendICSDialog from "./SendICSDialog";

/**
 * A whitelist of components to be renderd inside of modal.
 */
export const componentWhitelist = {
  CancelBookingDialog,
  FinalizeBookingsDialog,
  SendBookingsLinkDialog,
  SendBulkBookingsLinkDialog,
  DeleteCustomerDialog,
  ExtendBookingDateDialog,
  DeleteSlotDialog,
  DeleteSlotDisabledDialog,
  AddAttendedCustomersDialog,
  BirthdayDialog,
  SlotFormDialog,
  SendICSDialog,
};
