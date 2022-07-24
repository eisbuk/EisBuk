import React, { useState } from "react";
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

import { ButtonContextType } from "@/enums/components";

import { SlotsWeek } from "@/types/store";

import SlotOperationButtons, {
  // DeleteButton,
  CopyButton,
  PasteButton,
  NewSlotButton,
} from "@/components/atoms/SlotOperationButtons";
import SlotCard from "@/components/atoms/SlotCard";

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
import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import { comparePeriods, getSlotTimespan } from "@/utils/helpers";

import { adminLinks } from "@/data/navigation";
import { changeCalendarDate } from "@/store/actions/appActions";
import { AdminAria, useTranslation } from "@eisbuk/translations";

const SlotsPage: React.FC = () => {
  const dispatch = useDispatch();

  const currentDate = useSelector(getCalendarDay);
  const date = currentDate.startOf("week");

  useFirestoreSubscribe([OrgSubCollection.SlotsByDay]);

  const slotsToShow = useSelector(getAdminSlots);
  const daysToShow = Object.keys(slotsToShow);

  const weekToPaste = useSelector(getWeekFromClipboard);
  const dayToPaste = useSelector(getDayFromClipboard);

  const { t } = useTranslation();
  const [canEdit, setCanEdit] = useState(false);
  const toggleEdit = () => setCanEdit((a) => !a);
  const toggleEditButton = (
    <Button
      onClick={toggleEdit}
      color={canEdit ? ButtonColor.Primary : undefined}
      className={
        !canEdit ? "!text-black outline outline-gray-300 border-box" : ""
      }
      aria-label={t(AdminAria.EnableEdit)}
    >
      Enable Edit
    </Button>
  );

  const extraButtons = (
    <SlotOperationButtons
      className="h-8"
      slotsToCopy={{ week: Boolean(weekToPaste) }}
      contextType={ButtonContextType.Week}
      {...{ date }}
    >
      {canEdit && (
        <>
          {/* <DeleteButton /> */}
          <CopyButton />
          <PasteButton />
        </>
      )}
      {toggleEditButton}
    </SlotOperationButtons>
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
    <Layout isAdmin adminLinks={adminLinks}>
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
              {...{ date }}
            >
              <NewSlotButton />
              <CopyButton />
              <PasteButton />
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
              key={date.toISO()}
              date={date.toISODate()}
              additionalContent={canEdit ? additionalButtons : undefined}
            >
              <div className="grid gap-4 grid-cols-2">
                {slotsForDay.map((slot) => {
                  const selected = checkSelected(slot.id, weekToPaste);

                  return (
                    <div className="col-span-2 md:col-span-1">
                      <SlotCard
                        {...{ ...slot, selected }}
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
