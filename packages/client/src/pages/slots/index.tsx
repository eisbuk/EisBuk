import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { DateTime } from "luxon";

import { OrgSubCollection, SlotInterface } from "@eisbuk/shared";

import { ButtonContextType } from "@/enums/components";

import { SlotsWeek } from "@/types/store";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";
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

const SlotsPage: React.FC = () => {
  const dispatch = useDispatch();

  const currentDate = useSelector(getCalendarDay);
  const date = currentDate.startOf("week");

  useFirestoreSubscribe([OrgSubCollection.SlotsByDay]);

  const slotsToShow = useSelector(getAdminSlots);
  const daysToShow = Object.keys(slotsToShow);

  const weekToPaste = useSelector(getWeekFromClipboard);
  const dayToPaste = useSelector(getDayFromClipboard);

  const extraButtons = (
    <SlotOperationButtons
      slotsToCopy={{ week: Boolean(weekToPaste) }}
      contextType={ButtonContextType.Week}
      {...{ date }}
    >
      {/* <DeleteButton /> */}
      <CopyButton />
      <PasteButton />
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
    <>
      <AppbarAdmin />
      <DateNavigation {...{ extraButtons }} showToggle>
        {({ toggleState }) => (
          <>
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
                  {...{
                    date,
                    additionalButtons,
                  }}
                  showAdditionalButtons={toggleState}
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
                              enableEdit={toggleState}
                            />
                          </WrapElement>
                        );
                      })}
                    </>
                  )}
                </SlotsDayContainer>
              );
            })}
          </>
        )}
      </DateNavigation>
    </>
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
