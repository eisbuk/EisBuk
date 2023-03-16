import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DateTime } from "luxon";

import { OrgSubCollection, SlotInterface } from "@eisbuk/shared";
import {
  Button,
  ButtonColor,
  CalendarNav,
  Layout,
  SlotsDayContainer,
} from "@eisbuk/ui";

import { SlotsAria, useTranslation } from "@eisbuk/translations";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { ButtonContextType } from "@/enums/components";

import { LocalStore, SlotsWeek } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import SlotOperationButtons, {
  CopyButton,
  PasteButton,
  NewSlotButton,
} from "@/components/atoms/SlotOperationButtons";
import SlotCard from "@/components/atoms/SlotCard";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import { getAdminSlots } from "@/store/selectors/slots";
import { getCalendarDay } from "@/store/selectors/app";
import {
  getDayFromClipboard,
  getWeekFromClipboard,
} from "@/store/selectors/copyPaste";
import { getCustomersByBirthday } from "@/store/selectors/customers";

import {
  addSlotToClipboard,
  deleteSlotFromClipboard,
} from "@/store/actions/copyPaste";
import { changeCalendarDate } from "@/store/actions/appActions";

import { getSlotTimespan } from "@/utils/helpers";
import { comparePeriods } from "@/utils/sort";

import { adminLinks } from "@/data/navigation";

const SlotsPage: React.FC = () => {
  const dispatch = useDispatch();

  const currentDate = useSelector(getCalendarDay);
  const date = currentDate.startOf("week");

  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.SlotsByDay },
    { collection: OrgSubCollection.Attendance },
  ]);

  const slotsToShow = useSelector(getAdminSlots);
  const daysToShow = Object.keys(slotsToShow);

  const weekToPaste = useSelector(getWeekFromClipboard);
  const dayToPaste = useSelector(getDayFromClipboard);

  const attendance = useSelector(
    (state: LocalStore) => state.firestore.data.attendance || {}
  );

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  const { t } = useTranslation();

  // We're using this to disable the slot buttons when we're pasting a week
  // to signal to the user that the operation is in progress.
  //
  // Each time slots to display change (by the paste being aggregated in the db or switching view), we enable the buttons again.
  const [slotButtonsDisabled, setSlotButtonsDisabled] = useState(false);
  useEffect(() => {
    setSlotButtonsDisabled(false);
  }, [slotsToShow]);

  const [canEdit, setCanEdit] = useState(false);
  const toggleEdit = () => setCanEdit((a) => !a);
  const toggleEditButton = (
    <Button
      onClick={toggleEdit}
      color={canEdit ? ButtonColor.Primary : undefined}
      className={
        !canEdit ? "!text-black outline outline-gray-300 border-box" : ""
      }
      aria-label={t(SlotsAria.EnableEdit)}
    >
      {t(SlotsAria.EnableEdit)}
    </Button>
  );

  const extraButtons = (
    <div className="flex items-center">
      {canEdit && (
        <SlotOperationButtons
          className="mr-4"
          slotsToCopy={{ week: Boolean(weekToPaste) }}
          contextType={ButtonContextType.Week}
          disabled={slotButtonsDisabled}
          {...{ date }}
        >
          <CopyButton />
          <PasteButton onPaste={() => setSlotButtonsDisabled(true)} />
        </SlotOperationButtons>
      )}
      {toggleEditButton}
    </div>
  );

  const canClick =
    weekToPaste && weekToPaste.weekStart.toMillis() === date.toMillis();
  const handleSlotClick =
    ({ slot, selected }: { slot: SlotInterface; selected: boolean }) =>
    () => {
      if (selected) {
        dispatch(deleteSlotFromClipboard(slot.id));
      } else {
        dispatch(addSlotToClipboard(slot));
      }
    };

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <CalendarNav
        date={currentDate}
        onChange={(date) => dispatch(changeCalendarDate(date))}
        jump="week"
        additionalContent={extraButtons}
      />
      <div className="content-container">
        {daysToShow.map((dateISO) => {
          const date = DateTime.fromISO(dateISO);

          const additionalButtons = (
            <SlotOperationButtons
              contextType={ButtonContextType.Day}
              slotsToCopy={{
                day: Boolean(dayToPaste),
              }}
              disabled={slotButtonsDisabled}
              {...{ date }}
            >
              <NewSlotButton />
              <CopyButton />
              <PasteButton onPaste={() => setSlotButtonsDisabled(true)} />
            </SlotOperationButtons>
          );

          const slotsForDay = Object.values(slotsToShow[dateISO]).sort(
            (a, b) => {
              const aTimeString = getSlotTimespan(a.intervals);
              const bTimeString = getSlotTimespan(b.intervals);
              return comparePeriods(aTimeString, bTimeString);
            }
          );

          return (
            <SlotsDayContainer
              key={dateISO}
              date={dateISO}
              additionalContent={canEdit ? additionalButtons : undefined}
            >
              <div className="grid gap-4 grid-cols-2">
                {slotsForDay.map((slot) => {
                  const selected = checkSelected(slot.id, weekToPaste);

                  // Disable deletion of slots which have already been booked by someone
                  const slotAttendance = attendance[slot.id]?.attendances || {};
                  const hasBookings = Boolean(
                    Object.values(slotAttendance).length
                  );

                  return (
                    <div key={slot.id} className="col-span-2 md:col-span-1">
                      <SlotCard
                        {...{ ...slot, selected }}
                        disableDelete={hasBookings}
                        onClick={
                          canClick
                            ? handleSlotClick({ slot, selected })
                            : undefined
                        }
                        enableEdit={canEdit}
                      />
                    </div>
                  );
                })}
              </div>
            </SlotsDayContainer>
          );
        })}
      </div>
    </Layout>
  );
};

const checkSelected = (
  slotId: SlotInterface["id"],
  weekToPaste: SlotsWeek | null
): boolean => {
  // exit early if no weekToPaste
  if (!weekToPaste) return false;

  const slotInClipboard = Object.values(weekToPaste.slots).find(
    ({ id }) => id === slotId
  );

  return Boolean(slotInClipboard);
};

export default SlotsPage;
