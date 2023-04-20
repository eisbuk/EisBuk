import React, { useState, useMemo, useEffect, useRef } from "react";
import { DateTime } from "luxon";

import {
  useTranslation,
  BirthdayMenu as BirthdayEnums,
  AdminAria,
  DateFormat,
} from "@eisbuk/translations";
import { Customer, CustomersByBirthday } from "@eisbuk/shared";
import { Cake } from "@eisbuk/svg";

import Button from "../Button";
import { CustomerAvatar, BadgeSize } from "../UserAvatar";

import useClickOutside from "../hooks/useClickOutside";

interface BirthdayMenuProps {
  birthdays: CustomersByBirthday[];
  align?: "left" | "right";
  onCustomerClick?: (customerId: string) => void;
  onShowAll?: () => void;
}

const BirthdayMenu: React.FC<BirthdayMenuProps> = ({
  birthdays,
  align = "right",
  onCustomerClick = () => {},
  onShowAll = () => {},
}) => {
  const { t } = useTranslation();

  // Control the popup state
  const [isOpen, setIsOpen] = useState(false);

  const openPopup = () => setIsOpen(true);
  const closePopup = () => setIsOpen(false);

  const handleShowAll = () => {
    closePopup();
    onShowAll();
  };

  // Also close the popup on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, closePopup);

  // Update the current birthday date every second, so that
  // we can update the UI when the date changes (at midnight)
  const [birthdayDate, setBirthdayDate] = useState<string>(
    DateTime.now().toISODate().substring(5)
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setBirthdayDate(DateTime.now().toISODate().substring(5));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate today's birthdays for the badge
  const todaysBirthdays = useMemo(
    (): number =>
      birthdays.length > 0 && birthdays[0].date === birthdayDate
        ? birthdays[0].customers.length
        : 0,
    [birthdays, birthdayDate]
  );

  return (
    <div ref={containerRef} className="relative cursor-pointer select-none">
      <div className="relative group" onClick={openPopup}>
        <Button
          className="h-11 w-11 !p-2 group-hover:bg-white/10"
          aria-label={t(AdminAria.BirthdayMenu)}
        >
          <Cake />
        </Button>

        {Boolean(todaysBirthdays) && (
          <div className="absolute w-5 h-5 p-px flex justify-center items-center top-0 right-0 text-sm text-white bg-red-400 rounded-full">
            {todaysBirthdays}
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute w-[400px] top-full overflow-hidden bg-white z-50 rounded-sm shadow-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <ul className="py-2 space-y-2">
            {birthdays
              .flatMap(({ customers }) =>
                customers.map((customer) => (
                  <BirthdayMenuItem
                    key={customer.id}
                    {...customer}
                    onClick={onCustomerClick}
                  />
                ))
              )
              .slice(0, 5)}
          </ul>

          <button
            className="!w-full h-8 py-0.5 text-center rounded-none hover:bg-gray-200 active:bg-gray-100"
            onClick={handleShowAll}
          >
            {t(BirthdayEnums.ShowAll)}
          </button>
        </div>
      )}
    </div>
  );
};

// #region BirthdayMenuItem
interface MenuItemProps extends Customer {
  onClick?: (customerId: string) => void;
}
const BirthdayMenuItem: React.FC<MenuItemProps> = ({
  onClick = () => {},
  ...customer
}) => {
  const { t } = useTranslation();

  const customerBirthday =
    customer.birthday?.substring(5) === DateTime.now().toISODate().substring(5)
      ? t(DateFormat.Today)
      : t(DateFormat.DayMonth, {
          date: DateTime.fromISO(customer.birthday || ""),
        });

  return (
    <li
      onClick={() => onClick(customer.id)}
      className="px-4 py-2 flex gap-8 items-center hover:bg-gray-100/50"
    >
      <CustomerAvatar
        className="w-12 h-12"
        customer={customer}
        badgeSize={BadgeSize.MD}
      />

      <span>
        {customer.name} {customer.surname}
      </span>

      <span className="block ml-auto">{customerBirthday}</span>
    </li>
  );
};
// #endregion BirthdayMenuItem

export default BirthdayMenu;
