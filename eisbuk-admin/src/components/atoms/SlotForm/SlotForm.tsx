import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Formik, Field, Form } from "formik";
import * as yup from "yup";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import { SlotInterface, SlotInterval, SlotType, fromISO } from "eisbuk-shared";

import { defaultSlotFormValues, SlotFormValues } from "@/lib/data";

import {
  SlotFormTitle,
  ValidationMessage,
  DateFormat,
  ActionButton,
  SlotTypeLabel,
  SlotFormAria,
  SlotFormLabel,
} from "@/enums/translations";

import RadioSelection from "@/components/atoms/RadioSelection";
import SelectCategories from "./SelectCategories";
import SlotIntervals from "./SlotIntervals";

import { createNewSlot, updateSlot } from "@/store/actions/slotOperations";

import { slotToFormValues } from "./utils";

import { __cancelFormId__, __slotFormId__ } from "@/__testData__/testIds";

// #region validation
const timeFieldValidation = yup
  .string()
  .required(ValidationMessage.RequiredField)
  .test({
    message: ValidationMessage.InvalidTime,
    test: (time) => /^[0-9]?[0-9]:[0-9][0-9]$/.test(time || ""),
  });

const validationSchema = yup.object().shape({
  categories: yup
    .array()
    .required()
    .min(1, ValidationMessage.RequiredEntry)
    .of(yup.string()),
  intervals: yup.array().of(
    yup
      .object()
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
  type: yup.string().required(ValidationMessage.RequiredField),
});
// #endregion validation

interface Props {
  /**
   * ISO date of the slot we're creating (only the day, without the time of day and timezone).
   */
  date: string;
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
  const titleString = slotToEdit
    ? SlotFormTitle.EditSlot
    : SlotFormTitle.NewSlot;
  const titleDate = t(DateFormat.DayMonth, { date: fromISO(date) });
  const title = `${t(titleString)} ( ${titleDate} )`;

  // options for type selection radio group
  const typeOptions = Object.values(SlotType).map((typeKey) => ({
    value: typeKey,
    label: t(SlotTypeLabel[typeKey]),
  }));

  return (
    <Dialog
      className={classes.container}
      open={Boolean(open)}
      onClose={onClose}
    >
      <DialogTitle>{title}</DialogTitle>
      <Formik
        {...{ initialValues, validationSchema }}
        onSubmit={handleSubmit}
        validateOnChange={false}
      >
        {({ errors, isSubmitting, isValidating }) => (
          <Form data-testid={__slotFormId__}>
            <DialogContent>
              <Typography className={classes.typeTitle}>
                {t(SlotFormLabel.Type)}
              </Typography>
              <RadioSelection
                options={typeOptions}
                name="type"
                aria-label={t(SlotFormAria.SlotType)}
              />
              <SelectCategories />
              <SlotIntervals />
              <Field
                name="notes"
                className={[classes.field, classes.notesInput].join(" ")}
                as={TextField}
                label="Notes"
                multiline
                aria-label={t(SlotFormAria.SlotNotes)}
              />
            </DialogContent>
            <DialogActions>
              <Button
                color="primary"
                data-testid={__cancelFormId__}
                onClick={onClose}
                aria-label={t(SlotFormAria.CancelSlot)}
              >
                {t(ActionButton.Cancel)}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={
                  Boolean(Object.keys(errors).length) &&
                  (isSubmitting || isValidating)
                }
                color="primary"
                aria-label={
                  slotToEdit
                    ? t(SlotFormAria.ConfirmEditSlot)
                    : t(SlotFormAria.ConfirmCreateSlot)
                }
              >
                {slotToEdit
                  ? t(ActionButton.EditSlot)
                  : t(ActionButton.CreateSlot)}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

// #region styles
const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      "& .MuiDialog-paper": {
        [theme.breakpoints.down("sm")]: {
          margin: 0,
          width: "100%",
        },
      },
    },
    typeTitle: {
      letterSpacing: 1,
      fontSize: theme.typography.pxToRem(18),
      fontWeight: theme.typography.fontWeightBold,
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.primary.light,
      [theme.breakpoints.up("sm")]: {
        display: "none",
      },
    },
    field: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(0),
    },
    notesInput: {
      [theme.breakpoints.down("sm")]: {
        margin: theme.spacing(2),
      },
    },
  })
);
// #endregion styles

export default SlotForm;
