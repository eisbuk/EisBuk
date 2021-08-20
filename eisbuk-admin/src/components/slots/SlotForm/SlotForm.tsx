import React, { useState } from "react";
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
import Radio from "@material-ui/core/Radio";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Slot, Duration, Category, SlotType } from "eisbuk-shared";

import { SlotsLabelList, slotsLabelsLists } from "@/config/appConfig";

import { SlotOperation, SlotOperationBaseParams } from "@/types/slotOperations";

import { getNewSlotTime } from "@/store/selectors/app";

import { fs2luxon, capitalizeFirst } from "@/utils/helpers";
import { luxonToFB } from "@/utils/date";

import {
  __slotFormId__,
  __cancelFormId__,
  __confirmFormId__,
} from "@/__testData__/testIds";

// #region formSetup
const defaultValues = {
  time: "08:00" as string,
  durations: [Duration["1h"]],
  categories: [] as Category[],
  type: "" as SlotType,
  notes: "",
};

const SlotValidation = Yup.object().shape({
  time: Yup.string().required(i18n.t("SlotValidations.Time")),
  categories: Yup.array()
    .of(Yup.string().min(1))
    .required(i18n.t("SlotValidations.Category")),
  type: Yup.string().required(i18n.t("SlotValidations.Training")),
  durations: Yup.array()
    .of(Yup.number().min(1))
    .required(i18n.t("SlotValidations.Duration")),
});
// #endregion formSetup

// #region  timePickerField
type TimePickerProps = Omit<Omit<TextFieldProps, "name">, "value"> & {
  name: string;
  value: string;
};

const TimePickerField: React.FC<TimePickerProps> = (props) => {
  const { setFieldValue } = useFormikContext();

  /**
   * Get ISO time string of current value with applied difference,
   * used with increment/decrement handlers
   * @param delta time diff to add/substract
   * @returns ISO time string
   */
  const getCurrentTime = (delta: number) => {
    // try and parse time value
    const parsed = DateTime.fromISO(props.value);

    // if passed value is a valid ISO string (conversion was successful)
    // return time with increment/decrement
    if (!parsed.invalidReason) {
      return parsed.plus({ hours: delta }).toISOTime().substring(0, 5);
    }

    // if conversion failed, return fallback value
    return "08:00";
  };

  const decrease = () => setFieldValue(props.name, getCurrentTime(-1));
  const increase = () => setFieldValue(props.name, getCurrentTime(1));

  const useStyles = makeStyles(() => ({
    root: {
      whiteSpace: "nowrap",
    },
  }));

  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <IconButton color="primary" onClick={decrease}>
        -
      </IconButton>
      <TextField {...props} />
      <IconButton color="primary" onClick={increase}>
        +
      </IconButton>
    </Box>
  );
};
// #endregion  timePickerField

// #region mainComponent
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
  isoDate?: string;
  open: boolean;
  onClose?: () => void;
  onOpen?: unknown;
  slotToEdit?: Slot<"id">;
}

const SlotForm: React.FC<SlotFormProps & SimplifiedFormikProps> = ({
  createSlot = () => {},
  editSlot = () => {},
  isoDate = "01-01-2020",
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

  type OnSubmit = FormikConfig<Partial<typeof defaultValues>>["onSubmit"];

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
        date: luxonToFB(parsedTime),
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
        {({ errors, isSubmitting, isValidating }) => (
          <>
            <Form>
              <DialogTitle data-testid={__slotFormId__}>
                {parsedSlotEditDate
                  ? t("SlotForm.parsedSlotEditDate", {
                      date: parsedSlotEditDate,
                    })
                  : t("SlotForm.parsedSlotEditDate", { date: parsedDate })}
              </DialogTitle>
              <DialogContent>
                <FormControl component="fieldset">
                  {!slotToEdit && (
                    <>
                      <Field
                        name="time"
                        as={TimePickerField}
                        label={t("SlotForm.StartTime")}
                        className={classes.field}
                      />
                      <ErrorMessage name="time" />
                    </>
                  )}
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
                  <Box display="flex">
                    {getCheckBoxes(
                      "durations",
                      slotsLabelsLists.durations,
                      false
                    )}
                  </Box>
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
                <Button
                  color="primary"
                  onClick={onClose}
                  data-testid={__cancelFormId__}
                >
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
                  data-testid={__confirmFormId__}
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
// #endregion mainComponent

// #region createRadioButtons
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

// #endregion createRadioButtons

// #region getCheckboxes
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
// #endregion getCheckboxes

// #region myCheckbox
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

    /** @TODO delete the "Step {x}" comments and use @TODO flag like this: in multiline comments (for the fancy coloring ;) */
  }, [type, setFieldValue, name]);

  return (
    <FormControlLabel
      control={<Checkbox {...{ name, value }} {...field} />}
      // Step 3. disable the checkboxes in the UI in case of off-ice
      disabled={name === "categories" ? disabled : false}
      label={label}
    />
  );
};
// #endregion myCheckbox

// #region styles
const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  error: {
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
  },
}));
// #endregion styles

export default SlotForm;
