import React from "react";
import { DateTime } from "luxon";

import { Close } from "@eisbuk/svg";
import { CustomersByBirthday } from "@eisbuk/shared";
import { useTranslation, DateFormat, BirthdayMenu } from "@eisbuk/translations";

import { CustomerList } from "../CustomerList";
import IconButton from "../IconButton";

export interface BirthdayDialogProps {
  onClose?: () => void;
  onCustomerClick?: (customerId: string) => void;
  birthdays: CustomersByBirthday[];
}

const BirthdayDialog: React.FC<BirthdayDialogProps> = ({
  onClose = () => {},
  onCustomerClick = () => {},
  birthdays,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative bg-white rounded max-w-[400px] w-screen h-full overflow-hidden">
      <div className="w-full h-16 px-4 flex items-center justify-between bg-gray-800 text-white">
        <h2 className="text-xl">{t(BirthdayMenu.UpcomingBirthdays)}</h2>
        <IconButton className="!w-7 !h-7 opacity-80" onClick={onClose}>
          <Close />
        </IconButton>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-14rem)]">
        {birthdays.map(({ date, customers }) => {
          const title =
            date === DateTime.now().toISODate().substring(5)
              ? t(DateFormat.Today)
              : t(DateFormat.DayMonth, {
                  date: DateTime.fromISO(`2021-${date}`),
                });

          return (
            <React.Fragment key={title}>
              <h3 className="flex items-center text-xl p-4">{title}</h3>
              <CustomerList
                onCustomerClick={({ id }) => onCustomerClick(id)}
                className="mb-2"
                customers={customers}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BirthdayDialog;
