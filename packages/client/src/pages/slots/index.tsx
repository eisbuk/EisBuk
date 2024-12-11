import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DateTime } from "luxon";

import {
  OrgSubCollection,
  SlotInterface,
  getSlotTimespan,
  comparePeriodsEarliestFirst,
} from "@eisbuk/shared";
import {
  Button,
  ButtonColor,
  CalendarNav,
  SlotsDayContainer,
  LayoutContent,
} from "@eisbuk/ui";
import { Close, Pencil } from "@eisbuk/svg";

import { SlotsAria, useTranslation } from "@eisbuk/translations";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { ButtonContextType } from "@/enums/components";

import { LocalStore, SlotsWeek } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import AdminBar from "@/controllers/AdminBar"
import { NotificationsContainer } from "@/features/notifications/components/index";
import SlotOperationButtons, {
  CopyButton,
  PasteButton,
  NewSlotButton,
} from "@/components/atoms/SlotOperationButtons";
import ErrorBoundary from "@/components/atoms/ErrorBoundary";
import SlotCard from "@/controllers/SlotCard";

import { getAdminSlots } from "@/store/selectors/slots";
import { getCalendarDay } from "@/store/selectors/app";
import {
  getDayFromClipboard,
  getWeekFromClipboard,
} from "@/store/selectors/copyPaste";

import {
  addSlotToClipboard,
  deleteSlotFromClipboard,
} from "@/store/actions/copyPaste";
import { changeCalendarDate } from "@/store/actions/appActions";

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
    <div className="hidden items-center md:flex">
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
    <div className="absolute top-0 right-0 left-0 flex flex-col pt-[141px] md:pt-[272px]">
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

      <CalendarNav
        date={currentDate}
        onChange={(date) => dispatch(changeCalendarDate(date))}
        jump="week"
        additionalContent={extraButtons}
        className="fixed left-0 top-[72px] right-0 border-b border-gray-400 z-40 md:border-none md:top-[212px]"
      />
      <LayoutContent>
        <ErrorBoundary resetKeys={daysToShow}>
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
                return comparePeriodsEarliestFirst(aTimeString, bTimeString);
              }
            );

            return (
              <SlotsDayContainer
                key={dateISO}
                date={dateISO}
                additionalContent={canEdit ? additionalButtons : <div className="h-11 md:h-auto" />}
                stickyOffset="top-[141px] md:top-[272px]"
              >
                <div className="grid gap-4 grid-cols-2">
                  {slotsForDay.map((slot) => {
                    const selected = checkSelected(slot.id, weekToPaste);

                    // Disable deletion of slots which have already been booked by someone
                    const slotAttendance =
                      attendance[slot.id]?.attendances || {};
                    const hasBookings = Boolean(
                      Object.values(slotAttendance).length
                    );

                    return (
                      <div key={slot.id} className="col-span-2 xl:col-span-1">
                        <SlotCard
                          className="w-full"
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
        </ErrorBoundary>

        <div
          className="fixed bottom-0 w-full flex justify-end -mx-4 px-2 py-1.5 bg-ice-300 z-40 border-t border-gray-300 md:hidden"
        >
          {canEdit ? (
            <SlotOperationButtons
              slotsToCopy={{ week: Boolean(weekToPaste) }}
              contextType={ButtonContextType.Week}
              disabled={slotButtonsDisabled}
              {...{ date }}
            >
              <CopyButton />
              <PasteButton onPaste={() => setSlotButtonsDisabled(true)} />
              <Button
                onClick={() => setCanEdit(false)}
                className="w-11 h-11 text-gray-600"
                aria-label={t(SlotsAria.EnableEdit)}
              >
                <Close />
              </Button>
            </SlotOperationButtons>
          ) : (
            <Button
              onClick={() => setCanEdit(true)}
              className="h-11 text-gray-600"
              aria-label={t(SlotsAria.EnableEdit)}
            >
              <span className="text-md">Edit</span> <span className="w-8 h-8"><Pencil /></span>
            </Button>
          )}
        </div>

        <div className="fixed px-4 bottom-[70px] right-0 z-40 md:hidden">
          <NotificationsContainer />
        </div>
      </LayoutContent>
    </div>
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
