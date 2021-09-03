import React, { useState } from "react";
import firebase from "firebase/app";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Formik,
  Form,
  Field,
  useField,
  ErrorMessage,
  useFormikContext,
  FormikConfig,
  FieldArray,
  FormikValues,
  FormikHelpers,
} from "formik";
import { RadioGroup } from "formik-material-ui";
import { DateTime } from "luxon";
import * as Yup from "yup";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Radio from "@material-ui/core/Radio";
import TextField from "@material-ui/core/TextField";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Slot, Duration, Category, SlotType } from "eisbuk-shared";

import { SlotsLabelList, slotsLabelsLists } from "@/config/appConfig";

import { SlotOperation, SlotOperationBaseParams } from "@/types/slotOperations";

import { getNewSlotTime } from "@/store/selectors/app";

import { fs2luxon, capitalizeFirst } from "@/utils/helpers";

import {
  __endTimeErrorId__,
  __endTimeInputId__,
  __startTimeErrorId__,
  __startTimeInputId__,
} from "./__testData__/testIds";

const Timestamp = firebase.firestore.Timestamp;

// ***** Region Form Setup ***** //
const defaultValues = {
  time: "08:00" as string,
  intervals: [{ startTime: "08:00", endTime: "08:00" }],
  durations: [Duration["1h"]],
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
  onOpen?: unknown;
  slotToEdit?: Slot<"id">;
}

const NewSlotForm: React.FC<SlotFormProps & SimplifiedFormikProps> = ({
  createSlot = () => {},
  editSlot = () => {},
  isoDate,
  open,
  onClose = () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpen = () => {},
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

  type OnSubmit = FormikConfig<FormValues>["onSubmit"];

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
                {parsedSlotEditDate
                  ? t("SlotForm.parsedSlotEditDate", {
                      date: parsedSlotEditDate,
                    })
                  : t("SlotForm.parsedSlotEditDate", { date: parsedDate })}
              </DialogTitle>
              <DialogContent>
                <FormControl component="fieldset">
                  <Box display="flex" flexWrap="wrap">
                    {getCheckBoxes(
                      "categories",
                      slotsLabelsLists.categories,
                      true
                    )}
                  </Box>
                  <div className={classes.error}>
                    <ErrorMessage name="categories" />
                  </div>
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
                  {/* TODO: remove slot to edit => only  */}
                  {!slotToEdit && (
                    <FieldArray name="tickets">
                      {/* TODO: values.Intervals could be undefined */}
                      {() =>
                        values.intervals?.map((interval, i) => {
                          //    const intervalErrors = errors.Intervals?.length && errors.Intervals[i] || {};
                          //    const intervalTouched = touched.Intervals.length && touched.Intervals[i] || {};
                          return (
                            <div
                              key={i}
                              className="list-group list-group-flush"
                            >
                              <div className="list-group-item">
                                <div
                                  className={
                                    i % 2 === 0
                                      ? classes.intervalContainerEven
                                      : classes.intervalContainer
                                  }
                                >
                                  <Field
                                    as={TimePickerField}
                                    label={t("SlotForm.StartTime")}
                                    name={`Intervals.${i}.startTime`}
                                    type="text"
                                    data-testId={__startTimeInputId__}
                                  />
                                  <Field
                                    as={TimePickerField}
                                    label={t("SlotForm.EndTime")}
                                    name={`Intervals.${i}.endTime`}
                                    type="text"
                                    data-testId={__endTimeInputId__}
                                  />
                                  <IconButton
                                    aria-label="delete"
                                    color="primary"
                                    onClick={() =>
                                      deleteInterval(i, values, setValues)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>

                                  <ErrorMessage
                                    data-testid={__startTimeErrorId__}
                                    name="startTime"
                                  />
                                  <ErrorMessage
                                    data-testid={__endTimeErrorId__}
                                    name="endTime"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </FieldArray>
                  )}
                  <div className={classes.buttonContainer}>
                    <Button
                      onClick={(e) => addInterval(values, setValues)}
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
 * Create redio buttons for form (used for SlotTypea in this case)
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

// ***** Region Get Checkboxes ***** //
interface GetCheckBoxes {
  <N extends keyof Omit<SlotsLabelList, "types">>(
    name: N,
    values: SlotsLabelList[N],
    translate: boolean
  ): JSX.Element[];
}

/**
 * Creates checkbox elements for given entry (duration, slot type, notes)
 * @param name
 * @param values
 * @returns
 */
const getCheckBoxes: GetCheckBoxes = (name, values, translate) => {
  // we need capitalized name as "name" prop of form element is lowercase
  // and translations file's keys are 'PascalCased'
  const capitalizedName = capitalizeFirst(name);

  return values.map(({ id, label }) => {
    const translatedLabel = translate
      ? i18n.t(`${capitalizedName}.${label}`)
      : label;

    // final label, after needed processing
    const finalLabel = capitalizeFirst(translatedLabel);

    return <MyCheckbox key={id} name={name} value={id} label={finalLabel} />;
  });
};
// ***** End Region Get Checkboxes ***** //

// ***** Region My Checkbox ***** //
interface CheckboxProps {
  name: string;
  value: string;
  label: string;
}

/**
 * A custom Checkbox component: mapping of Formik props to MUI FormControl - Checkbox
 * @param param0
 * @returns
 */
export const MyCheckbox: React.FC<CheckboxProps> = ({ name, value, label }) => {
  // create field values from Formik
  const [field] = useField({ name, type: "checkbox", value });

  const {
    values: { type },
    setFieldValue,
  } = useFormikContext<{ type: SlotType }>();

  const [disabled, setDisabled] = useState(false);

  React.useEffect(() => {
    if (name === "categories") {
      if ([SlotType.OffIceDancing, SlotType.OffIceGym].includes(type)) {
        setFieldValue("categories", [
          "course",
          "pre-competitive",
          "competitive",
          "adults",
        ]);

        setDisabled(true);
      } else {
        setDisabled(false);
      }
    }
  }, [type, setFieldValue, name]);

  return (
    <FormControlLabel
      control={<Checkbox {...{ name, value }} {...field} />}
      disabled={name === "categories" ? disabled : false}
      label={label}
    />
  );
};
// ***** End Region My Checkbox ***** //

// ***** Region Interval Actions ***** //

/**
 * Creates new interval element when plus button is clicked
 * @returns
 */
const addInterval = (
  values: FormikValues,
  setValues: FormikHelpers<FormValues>["setValues"]
) => {
  // update intervals
  const intervals = [...values.Intervals];

  intervals.push({ startTime: "08:00", endTime: "09:00" });
  setValues({ ...values, intervals });

  // call formik onChange method
  // field.onChange(e);
};

/**
 * Deletes interval element when trash button is clicked
 * @returns
 */
const deleteInterval = (
  i: number,
  values: FormikValues,
  setValues: FormikHelpers<FormValues>["setValues"]
) => {
  // update intervals
  const intervals = [...values.intervals];
  if (intervals.length === 1) return;

  intervals.splice(i, 1);

  setValues({ ...values, intervals });
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
  intervalContainerEven: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: theme.spacing(1),
  },
  intervalContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.grey[50],
    paddingBottom: theme.spacing(1),
  },
}));
// ***** End Region Styles ***** //

export default NewSlotForm;
