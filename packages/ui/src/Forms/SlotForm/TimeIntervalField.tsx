import React from "react";
import { Field, useField } from "formik";

import { useTranslation, SlotFormAria } from "@eisbuk/translations";
import { Trash } from "@eisbuk/svg";
import {
  __deleteIntervalId__,
  __endTimeInputId__,
  __startTimeInputId__,
  __timeIntervalFieldId__,
} from "@eisbuk/shared";

import TimePickerField from "./TimePickerField";
import IconButton from "../../IconButton";
import FormError from "../FormError";

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
}

const TimeIntervalField: React.FC<Props> = ({ onDelete, dark, name }) => {
  const { t } = useTranslation();

  const colorClass = dark ? "bg-gray-50" : "";

  const [, { error }] = useField<string>(name);

  return (
    <div
      data-testid={__timeIntervalFieldId__}
      className={`relative w-full px-4 py-3 flex items-center justify-between gap-x-8 ${colorClass}`}
    >
      <div className="w-full flex flex-col gap-x-8 gap-y-4 sm:flex-row sm:justify-evenly">
        <Field
          name={`${name}.startTime`}
          label={t("SlotForm.StartTime")}
          data-testid={__startTimeInputId__}
          aria-label={t(SlotFormAria.IntervalStart)}
          component={TimePickerField}
          error={Boolean(error)}
        />
        <Field
          name={`${name}.endTime`}
          label={t("SlotForm.EndTime")}
          data-testid={__endTimeInputId__}
          aria-label={t(SlotFormAria.IntervalEnd)}
          component={TimePickerField}
          error={Boolean(error)}
        />
      </div>
      <IconButton
        className="!w-14 !h-10 py-1.5 bg-cyan-700 active:bg-cyan-600 text-white"
        data-testid={__deleteIntervalId__}
        aria-label={t(SlotFormAria.DeleteInterval)}
        color="primary"
        onClick={onDelete}
        disableHover
      >
        <Trash />
      </IconButton>

      <FormError className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {error}
      </FormError>
    </div>
  );
};

export default TimeIntervalField;