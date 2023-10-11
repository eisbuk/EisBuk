import React from "react";
import { useField } from "formik";

import { SlotAttendnace, SlotInterval } from "@eisbuk/shared";
import {
  useTranslation,
  SlotFormLabel,
  SlotFormAria,
} from "@eisbuk/translations";

import Button, { ButtonSize } from "../../Button";
import TimeIntervalField from "./TimeIntervalField";

import { defaultInterval } from "./data";

interface SlotIntervalProps {
  slotAttendances?: SlotAttendnace["attendances"];
}
const SlotIntervals: React.FC<SlotIntervalProps> = ({ slotAttendances }) => {
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

  const bookedIntervals =
    slotAttendances &&
    Object.values(slotAttendances).reduce(
      (acc, { bookedInterval }) => ({
        ...acc,
        [bookedInterval || ""]: bookedInterval,
      }),
      {}
    );
  const checkInterval = (
    interval: SlotInterval,
    bookedIntervals: Record<string, string> | undefined
  ): boolean => {
    return Boolean(
      bookedIntervals &&
        bookedIntervals[`${interval.startTime}-${interval.endTime}`]
    );
  };
  console.log({ bookedIntervals });
  return (
    <>
      <label
        htmlFor="intervals"
        className="block mb-4 text-sm font-medium text-gray-700"
      >
        {t(SlotFormLabel.Intervals)}
      </label>

      {intervals?.map((interval, i) => {
        console.log("checkInterval", checkInterval(interval, bookedIntervals));
        return (
          <TimeIntervalField
            key={i}
            name={`intervals[${i}]`}
            onDelete={() => deleteInterval(i)}
            dark={i % 2 === 1}
            disableUpdate={checkInterval(interval, bookedIntervals)}
          />
        );
      })}
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
