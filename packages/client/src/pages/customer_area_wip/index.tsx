import React from "react";
import { DateTime } from "luxon";

import {
  CalendarNav,
  IntervalCardGroup,
  Layout,
  SlotsDayContainer,
  TabItem,
} from "@eisbuk/ui";
import { Calendar, AccountCircle } from "@eisbuk/svg";

// #region temporaryTestData
import { SlotType } from "@eisbuk/shared";

import { saul } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";

const testDate = DateTime.fromISO("2022-01-01");

const daysToRender = Array(7)
  .fill(null)
  .map((_, i) => testDate.plus({ days: i }));

const slotsToRender = [baseSlot, { ...baseSlot, type: SlotType.OffIce }];
// #region temporaryTestData

const CustomerArea: React.FC = () => {
  const additionalButtons = (
    <>
      <TabItem Icon={Calendar as any} label="Book" />
      <TabItem Icon={AccountCircle as any} label="Calendar" />
    </>
  );

  return (
    <Layout additionalButtons={additionalButtons} user={saul}>
      <CalendarNav date={testDate} jump="month" />
      <div className="content-container">
        <div className="px-[44px]">
          {daysToRender.map((day) => (
            <SlotsDayContainer key={day.toISODate()} date={day}>
              {slotsToRender.map((slot) => (
                <IntervalCardGroup key={slot.type} {...slot} />
              ))}
            </SlotsDayContainer>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CustomerArea;
