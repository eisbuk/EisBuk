import React from "react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Formik, Field, Form } from "formik";
import * as yup from "yup";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterface, SlotInterval } from "eisbuk-shared";

import {
  __cancel__,
  __createSlot__,
  __editSlotTitle__,
  __editSlot__,
  __newSlotTitle__,
} from "@/lib/labels";
import { defaultSlotFormValues, SlotFormValues } from "@/lib/data";
import {
  __invalidTime,
  __requiredEntry,
  __requiredField,
  __timeMismatch,
} from "@/lib/errorMessages";

import SelectType from "./SelectType";
import SelectCategories from "./SelectCategories";
import SlotIntervals from "./SlotIntervals";

import { createNewSlot, updateSlot } from "@/store/actions/slotOperations";

import { slotToFormValues } from "./utils";

import { __cancelFormId__, __slotFormId__ } from "@/__testData__/testIds";

// #region validation
const validationSchema = yup.object().shape({
  categories: yup.array().required().min(1, __requiredEntry).of(yup.string()),
  intervals: yup.array().of(
    yup
      .object()
      .shape({
        startTime: yup
          .string()
          .required(__requiredField)
          .test({
            message: __invalidTime,
            test: (time) => /^[0-9]?[0-9]:[0-9][0-9]$/.test(time || ""),
          }),
        endTime: yup
          .string()
          .required(__requiredField)
          .test({
            message: __invalidTime,
            test: (time) => /^[0-9]?[0-9]:[0-9][0-9]$/.test(time || ""),
          }),
      })
      .required()
      .test({
        message: __timeMismatch,
        test: (interval: SlotInterval) =>
          interval &&
          interval.startTime &&
          interval.endTime &&
          interval.startTime < interval.endTime,
      })
  ),
  type: yup.string().required(__requiredField),
});
// #endregion validation

interface Props {
  /**
   * Date of slot we're creating (should be day, without the time of day).
   */
  date: DateTime;
  /**
   * Slot to edit. The presence of this prop automatically
   * uses the edit mode rather than create-new.
   */
  slotToEdit?: SlotInterface;
  /**
   * Control showing of the modal (and in effect the form).
   */
  open?: boolean;
  /**
   * Function called on submit or cancel button click.
   * Should be used to close the dialog modal.
   */
  onClose: () => void;
}

const SlotForm: React.FC<Props> = ({
  date: dateFromProps,
  slotToEdit,
  onClose,
  open,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  // get initial values and date
  // get date from `slotToEdit` or fallback to date passed in
  const { date, ...slotToEditValues } = slotToFormValues(slotToEdit) || {
    date: dateFromProps,
  };

  const initialValues = {
    ...defaultSlotFormValues,
    ...(slotToEditValues || {}),
  };

  const handleSubmit = (values: SlotFormValues) => {
    if (slotToEdit) {
      dispatch(updateSlot({ ...values, date, id: slotToEdit.id }));
    } else {
      dispatch(createNewSlot({ ...values, date }));
    }
    onClose();
  };

  // get title based on mode (new-slot/edit)
  const title = slotToEdit ? __editSlotTitle__ : __newSlotTitle__;

  return (
    <Dialog open={Boolean(open)} onClose={onClose}>
      <DialogTitle>{t(title, { date })}</DialogTitle>
      <Formik {...{ initialValues, onSubmit: handleSubmit, validationSchema }}>
        {({ errors, isSubmitting, isValidating }) => (
          <Form data-testid={__slotFormId__}>
            <DialogContent>
              <FormControl component="fieldset">
                <SelectType />
                <SelectCategories />
                <SlotIntervals />
                <Field
                  name="notes"
                  className={classes.field}
                  as={TextField}
                  label="Notes"
                  multiline
                />
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                color="primary"
                data-testid={__cancelFormId__}
                onClick={onClose}
              >
                {t(__cancel__)}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={
                  Boolean(Object.keys(errors).length) &&
                  (isSubmitting || isValidating)
                }
                color="primary"
              >
                {slotToEdit ? t(__editSlot__) : t(__createSlot__)}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0),
  },
}));
// #endregion styles

export default SlotForm;
