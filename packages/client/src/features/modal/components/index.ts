import Modal from "./Modal";

import CancelBookingDialog from "./CancelBookingDialog";
import FinalizeBookingsDialog from "./FinalizeBookingsDialog";
import SendBookingsLinkDialog from "./SendBookingsLinkDialog";
import DeleteCustomerDialog from "./DeleteCustomerDialog";
import ExtendBookingDateDialog from "./ExtendBookingDateDialog";

/**
 * A whitelist of components to be renderd inside of modal.
 */
export const componentWhitelist = {
  CancelBookingDialog,
  FinalizeBookingsDialog,
  SendBookingsLinkDialog,
  DeleteCustomerDialog,
  ExtendBookingDateDialog,
};

export { Modal };
