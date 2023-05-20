import React from "react";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import { useHistory } from "react-router-dom";

import { BirthdayMenu } from "@eisbuk/ui";
import { PrivateRoutes } from "@eisbuk/shared/ui";

import { createModal } from "@/features/modal/useModal";
import { getCustomersByBirthday } from "@/store/selectors/customers";

const BirthdayMenuController: React.FC = () => {
  const history = useHistory();

  const { openWithProps: openBirthdayDialog } = useBirthdayModal();

  const birthdays = useSelector(getCustomersByBirthday(DateTime.now()));

  const goToProfile = (customerId: string) => {
    history.push(`${PrivateRoutes.Athletes}/${customerId}`);
  };

  return (
    <BirthdayMenu
      birthdays={birthdays}
      onShowAll={() =>
        openBirthdayDialog({ birthdays, onCustomerClick: goToProfile })
      }
      onCustomerClick={goToProfile}
    />
  );
};

const useBirthdayModal = createModal("BirthdayDialog");

export default BirthdayMenuController;
