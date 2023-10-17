import React from "react";
import { Field, useField } from "formik";

import {
  useTranslation,
  SlotFormAria,
  SlotFormLabel,
} from "@eisbuk/translations";
import { Trash } from "@eisbuk/svg";

import { testId } from "@eisbuk/testing/testIds";

import TimePickerField from "./TimePickerField";
import IconButton from "../../IconButton";
import FormError from "../FormError";
import HoverText from "../../HoverText";

interface Props {
  /**
   * Remove interval handler, internally only fires an event.
   * IDing of the interval should be handled outside the component.
   */
  onDelete: () => void;
  /**
   * Display gray background (used for every other interval in the list).
   */
  dark?: boolean;
  /**
   * Input field name (used for Formik context: updating value etc.)
   */
  name: string;
  /**
   * Disable updating or deleting if booked
   */
  disableUpdate?: boolean;
  /**
   * A list of customer who have booked to show on hover text
   */
  customersWhoBooked?: string[];
}

const TimeIntervalField: React.FC<Props> = ({
  onDelete,
  dark,
  name,
  disableUpdate,
  customersWhoBooked,
}) => {
  const { t } = useTranslation();

  const colorClass = dark ? "bg-gray-50" : "";
  const iconButtonColor = disableUpdate
    ? "bg-gray-200"
    : "bg-cyan-700 active:bg-cyan-600";
  const cursor = disableUpdate ? "cursor-default" : "cursor-pointer";

  const [, { error }] = useField<string>(name);

  return (
    <div
      data-testid={testId("time-interval-field")}
      className={`relative w-full px-4 py-3 flex items-center justify-between gap-x-8 ${colorClass}`}
    >
      <div className="w-full flex flex-col gap-x-8 gap-y-4 sm:flex-row sm:justify-evenly">
        <Field
          key="startTime"
          name={`${name}.startTime`}
          label={t("SlotForm.StartTime")}
          data-testid={testId("start-time-input")}
          aria-label={t(SlotFormAria.IntervalStart)}
          component={TimePickerField}
          error={Boolean(error)}
          disabled={disableUpdate}
        />
        <Field
          key="endTime"
          name={`${name}.endTime`}
          label={t("SlotForm.EndTime")}
          data-testid={testId("end-time-input")}
          aria-label={t(SlotFormAria.IntervalEnd)}
          component={TimePickerField}
          error={Boolean(error)}
          disabled={disableUpdate}
        />
      </div>
      <IconButton
        className={[
          "!w-14 !h-10 py-1.5 text-white",
          iconButtonColor,
          cursor,
        ].join(" ")}
        data-testid={testId("delete-interval-button")}
        aria-label={t(SlotFormAria.DeleteInterval)}
        color="primary"
        onClick={onDelete}
        disableHover
        disabled={disableUpdate}
      >
        {disableUpdate ? (
          <HoverText
            className="contents bg-gray-200 font-medium border-r-2"
            multiline="sm"
            text={` ${t(
              SlotFormLabel.DeleteIntervalDisabled
            )}: ${customersWhoBooked?.join(", ")}`}
          >
            <Trash className="bg-gray-200 text-white" />
          </HoverText>
        ) : (
          <Trash />
        )}
      </IconButton>

      <FormError className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {error}
      </FormError>
    </div>
  );
};

export default TimeIntervalField;
