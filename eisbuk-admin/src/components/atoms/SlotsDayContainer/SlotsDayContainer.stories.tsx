import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import { ButtonContextType, SlotView } from "@/enums/components";

import { __storybookDate__ } from "@/lib/constants";

import SlotsDayContainer from "./SlotsDayContainer";
import SlotCard from "@/components/atoms/SlotCard";
import SlotOperationButtons, {
  NewSlotButton,
  CopyButton,
  PasteButton,
  DeleteButton,
} from "@/components/atoms/SlotOperationButtons";

import { collectionOfSlots } from "@/__testData__/dummyData";

export default {
  title: "Slots Day Container",
  component: SlotsDayContainer,
} as ComponentMeta<typeof SlotsDayContainer>;

const testDate = DateTime.fromISO(__storybookDate__);

const baseProps = {
  date: testDate,
};

export const Empty = (): JSX.Element => <SlotsDayContainer {...baseProps} />;

export const CustomerViewWithSlots = (): JSX.Element => (
  <SlotsDayContainer {...baseProps} view={SlotView.Customer}>
    {collectionOfSlots.map((slot) => (
      <SlotCard {...slot} key={slot.id} />
    ))}
  </SlotsDayContainer>
);

export const AdminViewWithSlots = (): JSX.Element => (
  <SlotsDayContainer {...baseProps}>
    {collectionOfSlots.map((slot) => (
      <SlotCard key={slot.id} {...slot} view={SlotView.Admin} />
    ))}
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
    {collectionOfSlots.map((slot) => (
      <SlotCard key={slot.id} {...slot} view={SlotView.Admin} />
    ))}
  </SlotsDayContainer>
);
