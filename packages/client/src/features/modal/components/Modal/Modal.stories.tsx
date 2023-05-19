import React from "react";
import { Provider as StoreProvider } from "react-redux";

import { Button, Layout } from "@eisbuk/ui";

import { baseSlot, createIntervals } from "@eisbuk/test-data/slots";

import { getNewStore } from "@/store/createStore";

import Modal from "./Modal";

import { openModal } from "@/features/modal/actions";

export default {
  title: "Modal",
  component: Modal,
};

const store = getNewStore();

const testSlot = {
  ...baseSlot,
  intervals: createIntervals(15),
};

export const CancelBookingsDialog = (): JSX.Element => (
  <StoreProvider store={store}>
    <Layout>
      <Button
        onClick={() =>
          store.dispatch(
            openModal({
              id: "modal",
              component: "CancelBookingDialog",
              props: {
                ...testSlot,
                interval: Object.values(testSlot.intervals)[0],
                secretKey: "12345",
              },
            })
          )
        }
        className="m-4 bg-gray-600"
      >
        Open modal
      </Button>
    </Layout>
    <Modal />
  </StoreProvider>
);
