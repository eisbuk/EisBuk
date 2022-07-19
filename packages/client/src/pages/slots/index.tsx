import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DateTime } from "luxon";

import { OrgSubCollection, SlotInterface } from "@eisbuk/shared";
import { Button, ButtonColor, CalendarNav, Layout } from "@eisbuk/ui";

import { ButtonContextType } from "@/enums/components";

import { SlotsWeek } from "@/types/store";

import SlotOperationButtons, {
  // DeleteButton,
  CopyButton,
  PasteButton,
  NewSlotButton,
} from "@/components/atoms/SlotOperationButtons";
import SlotsDayContainer from "@/components/atoms/SlotsDayContainer";
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

const SlotsPage: React.FC = () => {
  const dispatch = useDispatch();

  const currentDate = useSelector(getCalendarDay);
  const date = currentDate.startOf("week");

  useFirestoreSubscribe([OrgSubCollection.SlotsByDay]);

  const slotsToShow = useSelector(getAdminSlots);
  const daysToShow = Object.keys(slotsToShow);

  const weekToPaste = useSelector(getWeekFromClipboard);
  const dayToPaste = useSelector(getDayFromClipboard);

  const [canEdit, setCanEdit] = useState(false);
  const toggleEdit = () => setCanEdit((a) => !a);
  const toggleEditButton = (
    <Button
      onClick={toggleEdit}
      color={canEdit ? ButtonColor.Primary : undefined}
      className={
        !canEdit ? "!text-black outline outline-gray-300 border-box" : ""
      }
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

        const slotsForDay = Object.values(slotsToShow[dateISO]).sort((a, b) => {
          const aTimeString = getSlotTimespan(a.intervals);
          const bTimeString = getSlotTimespan(b.intervals);
          return comparePeriods(aTimeString, bTimeString);
        });

        return (
          <SlotsDayContainer
            key={date.toISO()}
            {...{
              date,
              additionalButtons,
            }}
            showAdditionalButtons={canEdit}
          >
            {({ WrapElement }) => (
              <>
                {slotsForDay.map((slot) => {
                  const selected = checkSelected(slot.id, weekToPaste);

                  return (
                    <WrapElement key={slot.id}>
                      <SlotCard
                        {...{ ...slot, selected }}
                        onClick={
                          canClick
                            ? handleSlotClick({ slot, selected })
                            : undefined
                        }
                        enableEdit={canEdit}
                      />
                    </WrapElement>
                  );
                })}
              </>
            )}
          </SlotsDayContainer>
        );
      })}
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
