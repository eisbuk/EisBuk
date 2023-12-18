import React from "react";
import { DateTime } from "luxon";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";

import {
  Category,
  SlotInterface,
  SlotInterfaceLoose,
  SlotInterval,
  SlotType,
} from "@eisbuk/shared";
import {
  useTranslation,
  SlotFormTitle,
  ValidationMessage,
  DateFormat,
  ActionButton,
  SlotTypeLabel,
  SlotFormLabel,
  CategoryLabel,
} from "@eisbuk/translations";

import FormField, { FormFieldVariant, FormFieldWitdh } from "../FormField";
import Checkbox from "../../Checkbox";
import Button, { ButtonSize } from "../../Button";
import SlotIntervals from "./SlotIntervals";

import { defaultSlotFormValues, SlotFormValues } from "./data";
import { slotToFormValues } from "./utils";

// #region validation
const timeFieldValidation = Yup.string()
  .required(ValidationMessage.RequiredField)
  .test({
    message: ValidationMessage.InvalidTime,
    test: (time) => /^[0-9]?[0-9]:[0-9][0-9]$/.test(time || ""),
  });

const validationSchema = Yup.object().shape({
  categories: Yup.array()
    .required()
    .min(1, ValidationMessage.RequiredEntry)
    .of(Yup.string()),
  intervals: Yup.array().of(
    Yup.object()
      .shape({
        startTime: timeFieldValidation,
        endTime: timeFieldValidation,
      })
      .required()
      .test({
        message: ValidationMessage.TimeMismatch,
        test: (interval: SlotInterval) =>
          interval &&
          interval.startTime &&
          interval.endTime &&
          interval.startTime < interval.endTime,
      })
  ),
  type: Yup.string().required(ValidationMessage.RequiredField),
});
// #endregion validation

export interface SlotFormProps {
  className?: string;
  /**
   * ISO date of the slot we're creating (only the day, without the time of day and timezone).
   */
  date: string;
  /**
   * Slot to edit. The presence of this prop automatically
   * uses the edit mode rather than create-new.
   */
  slotToEdit?: Partial<SlotInterface>;
  /**
   * Function called on submit or cancel button click.
   * Should be used to close the dialog modal.
   */
  onClose: () => void;
  /**
   * Propagate the submission and handle the logic outside the component.
   */
  onSubmit: (values: SlotInterfaceLoose) => void;
  /**
   * customers who booked intervals in this slot
   */
  bookedIntervalsCustomers?: { [interval: string]: string[] };
}

const SlotForm: React.FC<SlotFormProps> = ({
  className = "",
  date: dateFromProps,
  slotToEdit,
  onSubmit = () => {},
  onClose = () => {},
  bookedIntervalsCustomers = {},
}) => {
  const { t } = useTranslation();

  // get initial values and date
  // get date from `slotToEdit` or fallback to date passed in
  const slotToEditValues = slotToFormValues(slotToEdit);
  const date = slotToEdit?.date || dateFromProps;

  const initialValues = {
    ...defaultSlotFormValues,
    ...(slotToEditValues || {}),
  };

  const titleString = slotToEdit
    ? t(SlotFormTitle.EditSlot)
    : t(SlotFormTitle.NewSlot);
  const titleDate = t(DateFormat.DayMonth, { date: DateTime.fromISO(date) });

  const availableCategories = Object.values(Category);

  const categoryOptions = availableCategories.map((category) => ({
    value: category,
    label: t(CategoryLabel[category]),
  }));

  const typeOptions = Object.values(SlotType).map((type) => ({
    value: type,
    label: t(SlotTypeLabel[type]),
  }));

  const handleSubmit = ({
    intervals: intervalsArr,
    ...values
  }: SlotFormValues) => {
    // Transform the intevals into a record, rather than an array
    const intervals = intervalsArr.reduce(
      (acc, { startTime, endTime }) => ({
        ...acc,
        [`${startTime}-${endTime}`]: { startTime, endTime },
      }),
      {} as Record<string, SlotInterval>
    );

    onSubmit({ ...values, intervals, date, id: slotToEdit?.id });
    onClose();
  };

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      enableReinitialize
      onSubmit={handleSubmit}
      validateOnChange={false}
    >
      {({ values, errors, touched, setValues }) => {
        const disableCategories = values.type === SlotType.OffIce;

        // For OffIce slots, we want to disable the categories and have them
        // all selected by default.
        if (
          disableCategories &&
          !Object.values(Category).every((category) =>
            values.categories.includes(category)
          )
        ) {
          setValues({
            ...values,
            categories: Object.values(Category),
          });
        }

        return (
          <Form
            className={`bg-white flex flex-col overflow-hidden ${className}`}
          >
            <h2 className="h-24 px-6 py-4 flex justify-between items-end bg-gray-800 leading-none font-mono cursor-normal select-none">
              <span className="text-2xl text-white">{titleString}</span>
              <span className="text-xl text-gray-300">{titleDate}</span>
            </h2>

            <div className="px-6 pt-4 pb-8 h-full space-y-4 overflow-auto">
              <div className="w-full grid grid-cols-12">
                <div className="col-span-6">
                  <label
                    htmlFor="type"
                    className="block mb-4 text-sm font-medium text-gray-700"
                  >
                    {t(SlotFormLabel.Type)}
                  </label>
                  <fieldset className="px-4 space-y-2">
                    {typeOptions.map((type) => (
                      <Field
                        {...type}
                        name="type"
                        type="radio"
                        className="col-span-2"
                        key={type.label}
                        component={Checkbox}
                      />
                    ))}
                  </fieldset>
                  <p className="mt-2 text-sm min-h-[20px] text-red-600">
                    {errors.type && touched.type && t(errors.type)}
                  </p>
                </div>

                <FormField
                  name="capacity"
                  variant={FormFieldVariant.Number}
                  label={t(SlotFormLabel.Capacity)}
                  helpText={t(SlotFormLabel.CapacityDescription)}
                  width={FormFieldWitdh.Full}
                />
              </div>

              <label
                htmlFor="categories"
                className="block mb-4 text-sm font-medium text-gray-700"
              >
                {t(SlotFormLabel.Categories)}
              </label>
              <fieldset className="px-4 col-span-4 grid grid-cols-4 gap-2">
                {categoryOptions.map((category) => (
                  <Field
                    {...category}
                    name="categories"
                    type="checkbox"
                    className="col-span-2"
                    key={category.label}
                    component={Checkbox}
                    disabled={disableCategories}
                  />
                ))}
              </fieldset>
              <p className="mt-2 text-sm min-h-[20px] text-red-600">
                {errors.categories &&
                  touched.categories &&
                  t(errors.categories)}
              </p>

              <SlotIntervals
                bookedIntervalsCustomers={bookedIntervalsCustomers}
              />

              <FormField
                name="notes"
                variant={FormFieldVariant.Text}
                multiline
                label={"Notes"}
              />
            </div>

            <div className="flex px-6 py-3 border-t items-center justify-end">
              <Button
                onClick={onClose}
                className="text-cyan-700"
                size={ButtonSize.LG}
              >
                {t(ActionButton.Cancel)}
              </Button>
              <Button
                type="submit"
                className="bg-cyan-700"
                size={ButtonSize.LG}
              >
                {t(ActionButton.Save)}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default SlotForm;
