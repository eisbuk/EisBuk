import React from "react";
import { useField } from "formik";

import { SlotInterval } from "@eisbuk/shared";
import {
  useTranslation,
  SlotFormLabel,
  SlotFormAria,
} from "@eisbuk/translations";

import Button, { ButtonSize } from "../../Button";
import TimeIntervalField from "./TimeIntervalField";

import { defaultInterval } from "./data";

const SlotIntervals: React.FC = () => {
  const { t } = useTranslation();

  const [{ value: intervals }, , { setValue }] =
    useField<SlotInterval[]>("intervals");

  const addInterval = () => {
    // e.preventDefault();
    const newIntervals = [...intervals, defaultInterval];
    setValue(newIntervals);
  };
  const deleteInterval = (index: number) => {
    const filteredIntervals = intervals.filter((_, i) => i !== index);
    setValue(filteredIntervals);
  };

  return (
    <>
      <label
        htmlFor="intervals"
        className="block mb-4 text-sm font-medium text-gray-700"
      >
        {t(SlotFormLabel.Intervals)}
      </label>

      {intervals?.map((_, i) => (
        <TimeIntervalField
          key={i}
          name={`intervals[${i}]`}
          onDelete={() => deleteInterval(i)}
          dark={i % 2 === 1}
        />
      ))}
      <div className="flex justify-center items-center">
        <Button
          onClick={addInterval}
          className="mt-6 bg-cyan-700 active:bg-cyan-600"
          aria-label={t(SlotFormAria.AddInterval)}
          size={ButtonSize.MD}
          type="button"
        >
          {t(SlotFormLabel.AddInterval)}
        </Button>
      </div>
    </>
  );
};

export default SlotIntervals;
