import React from "react";
import { useTranslation, ActionButton } from "@eisbuk/translations";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import {
  Button,
  IconButton,
  IconButtonContentSize,
  IconButtonShape,
  IconButtonSize,
} from "@eisbuk/ui";
import { testId } from "@eisbuk/testing/testIds";

import { Calendar } from "@eisbuk/svg";

import {
  getBookingsCustomer,
  getHasBookingsForCalendar,
} from "@/store/selectors/bookings";
import { createModal } from "@/features/modal/useModal";

const AddToCalendar: React.FC = () => {
  const { secretKey } = useParams<{ secretKey: string }>();

  const { t } = useTranslation();

  const { email } = useSelector(getBookingsCustomer) || {};
  const hasBookingsForCalendar = useSelector(getHasBookingsForCalendar);

  const { open: openModal } = useSendICSModal({ secretKey, email });

  // Don't render the component if there are no booked slots to save to calendar
  if (!hasBookingsForCalendar) return null;

  return (
    <>
      <Button
        className="hidden bg-cyan-700 text-white md:block active:bg-cyan-800"
        onClick={openModal}
      >
        {t(ActionButton.AddToCalendar)}
      </Button>

      <IconButton
        aria-label={t(ActionButton.AddToCalendar)}
        data-testid={testId("add-to-calendar")}
        className="fixed right-6 bottom-8 z-40 bg-cyan-700 text-white shadow-xl md:hidden"
        size={IconButtonSize.XL}
        contentSize={IconButtonContentSize.Loose}
        shape={IconButtonShape.Round}
        onClick={openModal}
      >
        <Calendar />
      </IconButton>
    </>
  );
};

const useSendICSModal = createModal("SendICSDialog");

export default AddToCalendar;
