import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import { ButtonContextType } from "@/enums/components";

import { __storybookDate__ } from "@/lib/constants";

import SlotsDayContainer from "./SlotsDayContainer";
import BookingCardGroup from "@/components/atoms/BookingCardGroup";
import SlotCard from "@/components/atoms/SlotCard";
import SlotOperationButtons, {
  NewSlotButton,
  CopyButton,
  PasteButton,
  DeleteButton,
} from "@/components/atoms/SlotOperationButtons";

import { collectionOfSlots } from "@/__testData__/slots";

export default {
  title: "Slots Day Container",
  component: SlotsDayContainer,
} as ComponentMeta<typeof SlotsDayContainer>;

const testDate = DateTime.fromISO(__storybookDate__);

const baseProps = {
  date: testDate,
};

export const Empty = (): JSX.Element => <SlotsDayContainer {...baseProps} />;

export const AdminWithSlots = (): JSX.Element => (
  <SlotsDayContainer {...baseProps}>
    {({ WrapElement }) => (
      <>
        {collectionOfSlots.map((slot) => (
          <WrapElement key={slot.id}>
            <SlotCard {...slot} />
          </WrapElement>
        ))}
      </>
    )}
  </SlotsDayContainer>
);

const confirmDialog = {
  title: "Test confirm dialog",
  description: "This is a test confirm dialog description",
};

const additionalButtons = (
  <SlotOperationButtons
    contextType={ButtonContextType.Day}
    date={testDate}
    iconSize="small"
  >
    <NewSlotButton />
    <CopyButton />
    <PasteButton />
    <DeleteButton {...{ confirmDialog }} />
  </SlotOperationButtons>
);

export const AdminViewWithAdditionalButtons = (): JSX.Element => (
  <SlotsDayContainer
    {...baseProps}
    {...{ additionalButtons }}
    showAdditionalButtons
  >
    {({ WrapElement }) => (
      <>
        {collectionOfSlots.map((slot) => (
          <WrapElement key={slot.id}>
            <SlotCard {...slot} />
          </WrapElement>
        ))}
      </>
    )}
  </SlotsDayContainer>
);

export const CustomerViewWithBookings = (): JSX.Element => (
  <SlotsDayContainer {...baseProps} {...{ additionalButtons }}>
    {({ WrapElement }) => (
      <>
        {collectionOfSlots.map((slot) => (
          <BookingCardGroup key={slot.id} {...{ ...slot, WrapElement }} />
        ))}
      </>
    )}
  </SlotsDayContainer>
);
