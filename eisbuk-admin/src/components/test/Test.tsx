import React, { useRef, useEffect, useState } from "react";

const Test: React.FC = () => {
  const testList = ["Item1", "Item2", "Item3", "Item4"];

  const ref = useRef<string[]>([testList[0]]);
  const newState = useRef<string[] | null>(null);

  const [counter, setCounter] = useState(0);
  const [state, setState] = useState([testList[0]]);

  const getState = () => state;

  console.log("Running block code");

  useEffect(() => {
    const updatedState = newState.current;

    console.log("State change detected");
    console.log("Counter > ", counter);
    console.log("State > ", state);
    console.log("Ref > ", ref.current);
    console.log("NewState > ", newState.current);
    ref.current = state;

    return () => {
      const state = getState();
      console.log("Performing cleanup");
      console.log("Counter in cleanup > ", counter);
      console.log("State in cleanup > ", state);
      console.log("Ref in cleanup > ", ref.current);
      console.log("NewState in cleanup > ", newState.current);
      const tos = filterIntersection(state, updatedState!);
      console.log("Top of Stack > ", tos);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <button
      onClick={() => {
        const newCounter = counter + 1;
        const stateUpdate = [...state, testList[newCounter]];

        setCounter(newCounter);
        setState(stateUpdate);
        newState.current = stateUpdate;
      }}
    >
      Increment ({counter})
    </button>
  );
};

const filterIntersection = (arr1: string[], arr2: string[]) =>
  arr2.filter((item) => !arr1.includes(item));

export default Test;
