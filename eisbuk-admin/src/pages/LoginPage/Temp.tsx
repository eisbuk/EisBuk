import React from "react";
import { useDispatch } from "react-redux";

import { ORGANIZATION } from "@/config/envInfo";

import { FirestoreThunk } from "@/types/store";
import { Collection, OrgSubCollection } from "eisbuk-shared";
import { baseSlot } from "@/__testData__/dummyData";

const Temp: React.FC = () => {
  const createBadSlot: FirestoreThunk = async (
    dispatch,
    getState,
    { getFirebase }
  ) => {
    const slotRef = getFirebase()
      .firestore()
      .collection(Collection.Organizations)
      .doc(ORGANIZATION)
      .collection(OrgSubCollection.Slots)
      .doc("slot-1");
    await slotRef.set({ ...baseSlot, date: "2021-03-03" });
    const slot = (await slotRef.get()).data();
    console.log("Slot in firestore", slot);
  };

  const dispatch = useDispatch();
  const handleClick = () => {
    dispatch(createBadSlot);
  };
  return <button onClick={handleClick}>Create bad slot</button>;
};

export default Temp;
