import React from "react";
import firebase from "firebase/app";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FormikConfig,
  FormikValues,
  FormikHelpers,
} from "formik";
import { RadioGroup } from "formik-material-ui";
import { DateTime } from "luxon";
import * as Yup from "yup";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import TextField from "@material-ui/core/TextField";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Slot, Category, SlotType } from "eisbuk-shared";

import { SlotsLabelList, slotsLabelsLists } from "@/config/appConfig";

import { SlotOperation, SlotOperationBaseParams } from "@/types/slotOperations";

import { getNewSlotTime } from "@/store/selectors/app";

import { fs2luxon } from "@/utils/helpers";

const Timestamp = firebase.firestore.Timestamp;

// ***** Region Form Setup ***** //
interface SlotInterval {
  startTime: string;
  endTime: string;
}

const defaultValues = {
  time: "08:00" as string,
  intervals: [{ startTime: "08:00", endTime: "09:00" }] as SlotInterval[],
  categories: [] as Category[],
  type: "" as SlotType,
  notes: "",
};

// TODO: check validation acoording to type
const SlotValidation = Yup.object().shape({
  time: Yup.string().required(i18n.t("SlotValidations.Time")),
  intervals: Yup.array().of(
    Yup.object().shape({
      startTime: Yup.string().required("Start Time is required"),
      endTime: Yup.string().required("End Time is required"),
    })
  ),
  //   startTime: Yup.date().required(i18n.t("SlotValidations.Time")).max(endTime),
  //   endTime: Yup.date().required(i18n.t("SlotValidations.Time")).max(endTime),
  categories: Yup.array()
    .of(Yup.string().min(1))
    .required(i18n.t("SlotValidations.Category")),
  type: Yup.string().required(i18n.t("SlotValidations.Training")),
  durations: Yup.array()
    .of(Yup.number().min(1))
    .required(i18n.t("SlotValidations.Duration")),
});
// ***** End Region Form Setup ***** //

// ***** Region Main Component ***** //
type FormikProps = Parameters<typeof Formik>[0];

/**
 * Created so that TypeScript doesn't complain on overwriting the omitted props (as they're passed later on)
 */
type SimplifiedFormikProps = Omit<
  Omit<FormikProps, "initialValues">,
  "onSubmit"
>;

export interface SlotFormProps {
  createSlot?: SlotOperation<"create">;
  editSlot?: SlotOperation;
  isoDate: string;
  open: boolean;
  onClose?: () => void;
  slotToEdit?: Slot<"id">;
}

const NewSlotForm: React.FC<SlotFormProps & SimplifiedFormikProps> = ({
  createSlot = () => {},
  editSlot = () => {},
  isoDate,
  open,
  onClose = () => {},
  slotToEdit,
  ...props
}) => {
  const classes = useStyles();

  const lastTime = useSelector(getNewSlotTime);

  const parsedDate = DateTime.fromISO(isoDate);

  const parsedSlotEditDate = slotToEdit ? fs2luxon(slotToEdit.date) : undefined;

  if (lastTime !== null) {
    defaultValues["time"] = fs2luxon(lastTime).toFormat("HH:mm");
  }
  const { t } = useTranslation();

  type OnSubmit = FormikConfig<any>["onSubmit"];

  /**
   * onSubmit handler for Formik
   * @param values
   * @param param1
   */
  const handleSubmit: OnSubmit = async (
    values,
    { setSubmitting, resetForm }
  ) => {
    const parsedTime = DateTime.fromISO(isoDate + "T" + values.time);

    const {
      categories,
      durations,
      notes,
      type,
    } = values as SlotOperationBaseParams;

    if (slotToEdit) {
      await editSlot({
        id: slotToEdit.id,
        type,
        categories,
        durations,
        notes,
      });
    } else {
      await createSlot({
        type,
        categories,
        durations,
        notes,
        date: Timestamp.fromDate(parsedTime.toJSDate()),
      });
    }
    setSubmitting(false);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Formik
        initialValues={{ ...defaultValues, ...slotToEdit }}
        validationSchema={SlotValidation}
        onSubmit={handleSubmit}
        {...props}
      >
        {({ errors, isSubmitting, isValidating, setValues, values }) => (
          <>
            <Form>
              <DialogTitle>
                {t("SlotForm.parsedSlotEditDate", {
                  date: parsedSlotEditDate ?? parsedDate,
                })}
              </DialogTitle>
              <DialogContent>
                <FormControl component="fieldset">
                  <Field
                    component={RadioGroup}
                    name="type"
                    label={t("SlotForm.Type")}
                    row
                    className={classes.field}
                  >
                    {createRadioButtons(slotsLabelsLists.types)}
                  </Field>
                  <div className={classes.error}>
                    <ErrorMessage name="type" />
                  </div>

                  <h5 className={classes.intervalTitles}>
                    {t("SlotForm.Intervals")}
                  </h5>
                  <div className={classes.buttonContainer}>
                    <Button
                      onClick={() => addInterval(values, setValues)}
                      color="primary"
                      variant="contained"
                      className={classes.addInterval}
                    >
                      {t("SlotForm.AddInterval")}
                    </Button>
                  </div>
                  <Field
                    name="notes"
                    className={classes.field}
                    as={TextField}
                    label="Note"
                    multiline
                  />
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button color="primary" onClick={onClose}>
                  {t(`SlotForm.Cancel`)}
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={
                    !Object.keys(errors).length &&
                    (isSubmitting || isValidating)
                  }
                  color="primary"
                >
                  {slotToEdit
                    ? t("SlotForm.EditSlot")
                    : t("SlotForm.CreateSlot")}
                </Button>
              </DialogActions>
            </Form>
          </>
        )}
      </Formik>
    </Dialog>
  );
};
// ***** End Region Main Component ***** //

// ***** Region Create Radio Buttons ***** //
/**
 * Create redio buttons for form (used for SlotTypes in this case)
 * @param values
 * @returns
 */
const createRadioButtons = (values: SlotsLabelList["types"]) =>
  values.map(({ id, label }) => (
    <FormControlLabel
      key={id}
      value={id}
      label={i18n.t(`SlotTypes.${label}`)}
      control={<Radio />}
    />
  ));

// ***** End Region Create Radio Buttons ***** //

// ***** Region Interval Actions ***** //

/**
 * Creates new interval element when plus button is clicked
 * @returns
 */
const addInterval = (
  values: FormikValues,
  setValues: FormikHelpers<any>["setValues"]
) => {
  // update intervals
  const intervals = [...values.Intervals];

  intervals.push({ startTime: "08:00", endTime: "09:00" });
  setValues({ ...values, intervals });

  // call formik onChange method
  // field.onChange(e);
};

// ***** End Region Interval Actions ***** //

// ***** Region Styles ***** //
const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0),
  },
  addInterval: {
    marginTop: theme.spacing(3),
    borderRadius: theme.spacing(100),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
  },
  intervalTitles: {
    fontSize: theme.typography.pxToRem(17),
    fontWeight: theme.typography.fontWeightLight,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
  },
}));
// ***** End Region Styles ***** //

export default NewSlotForm;
