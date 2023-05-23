import React from "react";
import { Provider as StoreProvider } from "react-redux";

import { Button, Layout } from "@eisbuk/ui";

import { getNewStore } from "@/store/createStore";

import Modal from "./Modal";
import { openModal } from "@/features/modal/actions";
import { testSlot } from "@/store/actions/__testData__/slotOperations";

export default {
  title: "Modal",
  component: Modal,
};

const store = getNewStore();

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
                id: "slot",
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
