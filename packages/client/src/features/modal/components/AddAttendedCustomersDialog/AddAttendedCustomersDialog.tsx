import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Customer, CustomerFull, SlotInterface } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  AdminAria,
  useTranslation,
} from "@eisbuk/translations";
import { CustomerList, IconButton, SearchBar } from "@eisbuk/ui";
import { Close } from "@eisbuk/svg";

import { ModalProps } from "@/features/modal/types";

import { markAttendance } from "@/store/actions/attendanceOperations";

type AddAttendedCustomersProps = ModalProps<
  SlotInterface & {
    defaultInterval: string;
    customers: CustomerFull[];
  }
>;

const AddAttendedCustomersDialog: React.FC<AddAttendedCustomersProps> = ({
  onClose,
  className,
  customers,
  defaultInterval,
  ...slot
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { id: slotId } = slot;
  const handleCustomerClick = ({ id: customerId, name, surname }: Customer) => {
    dispatch(
      markAttendance({
        customerId,
        name,
        surname,
        slotId,
        attendedInterval: defaultInterval,
      })
    );
  };

  // Search logic
  const [filterString, setFilterString] = useState("");

  // Close the modal when there are no more customers to show
  useEffect(() => {
    if (!customers.length) {
      onClose();
    }
  }, [customers]);

  return (
    <div
      aria-label="add-athletes-dialog"
      className={[
        className,
        "relative h-full w-[90vw] bg-white overflow-hidden pt-16 pb-0 rounded sm:w-[70vw] md:w-[35vw]",
      ].join(" ")}
    >
      <h2 className="absolute left-6 top-8 -translate-y-1/2 text-xl font-bold">
        {i18n.t(ActionButton.AddCustomers)}
      </h2>
      <IconButton
        className="absolute w-12 h-12 top-8 right-8 -translate-y-1/2 translate-x-1/2 text-gray-500"
        aria-label={t(AdminAria.CloseModal)}
        onClick={() => onClose()}
      >
        <Close />
      </IconButton>

      <SearchBar
        value={filterString}
        onChange={(e) => setFilterString(e.target.value)}
      />
      <CustomerList
        className="h-[calc(100vh-14rem)] overflow-y-auto"
        customers={customers}
        filterString={filterString}
        onCustomerClick={handleCustomerClick}
      />
    </div>
  );
};

export default AddAttendedCustomersDialog;
