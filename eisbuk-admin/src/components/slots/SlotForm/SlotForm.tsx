import React from "react";
import firebase from "firebase/app";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  TextField,
  TextFieldProps,
} from "@material-ui/core";
import { RadioGroup } from "formik-material-ui";
import {
  Formik,
  Form,
  Field,
  useField,
  ErrorMessage,
  useFormikContext,
} from "formik";
import { DateTime } from "luxon";
import * as Yup from "yup";

import { SlotsLabelList, slotsLabelsLists } from "@/config/appConfig";

import { LocalStore } from "@/types/store";
import { Slot } from "@/types/firestore";
import { SlotOperation, SlotOperationBaseParams } from "@/types/slotOperations";

import { Duration } from "@/enums/firestore";

import { fs2luxon } from "@/utils/helpers";

const Timestamp = firebase.firestore.Timestamp;

// ***** Region Form Setup ***** //
const defaultValues = {
  time: "08:00",
  durations: [Duration["1h"]],
  categories: [],
  type: "",
  notes: "",
};

const SlotValidation = Yup.object().shape({
  time: Yup.string().required("Manca l'ora"),
  categories: Yup.array()
    .of(Yup.string().min(1))
    .required("Scegli almeno una categoria"),
  type: Yup.string().required("Scegli il tipo di allenamento"),
  durations: Yup.array()
    .of(Yup.number().min(1))
    .required("Devi scegliere almeno una durata"),
});
// ***** End Region Form Setup ***** //

// ***** Region Time Picker Field ***** //
type TimePickerProps = Omit<Omit<TextFieldProps, "name">, "value"> & {
  name: string;
  value: string;
};

const TimePickerField: React.FC<TimePickerProps> = (props) => {
  const { setFieldValue } = useFormikContext();

  /**
   *
   * @param delta
   * @returns
   */
  const getCurrentTime = (delta: number) => {
    const parsed = DateTime.fromISO(props.value);
    if (!(parsed as any).invalid) {
      /** @TEMP `any` assertion, according to TypeScript, this shouldn't work */
      return parsed.plus({ hours: delta }).toISOTime().substring(0, 5);
    }
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
// ***** End Region Time Picker Field ***** //

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
  editSlot?: SlotOperation<"edit">;
  isoDate: string;
  open: boolean;
  onClose?: () => void;
  onOpen?: unknown;
  slotToEdit?: Slot<"id">;
}

const SlotForm: React.FC<SlotFormProps & SimplifiedFormikProps> = ({
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

  /** @TODO make this an imported selector */
  const lastTime = useSelector((state: LocalStore) => state.app.newSlotTime);

  const parsedDate = DateTime.fromISO(isoDate);

  const parsedSlotEditDate = slotToEdit ? fs2luxon(slotToEdit.date) : undefined;

  if (lastTime !== null) {
    defaultValues["time"] = fs2luxon(lastTime).toFormat("HH:mm");
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <Formik
        initialValues={{ ...defaultValues, ...slotToEdit }}
        validationSchema={SlotValidation}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
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
              type: values.type,
              categories: values.categories,
              durations: values.durations,
              notes: values.notes,
              date: Timestamp.fromDate(parsedTime.toJSDate()),
            });
          }
          setSubmitting(false);
          resetForm();
          onClose();
        }}
        {...props}
      >
        {({ errors, isSubmitting, isValidating }) => (
          <>
            <Form>
              <DialogTitle>
                {parsedSlotEditDate
                  ? parsedSlotEditDate.toFormat("EEEE d MMMM - HH:mm", {
                      locale: "it-IT",
                    })
                  : parsedDate.toFormat("EEEE d MMMM", { locale: "it-IT" })}
              </DialogTitle>
              <DialogContent>
                <FormControl component="fieldset">
                  {!slotToEdit && (
                    <>
                      <Field
                        name="time"
                        as={TimePickerField}
                        label="Ora di inizio"
                        className={classes.field}
                      />
                      <ErrorMessage name="time" />
                    </>
                  )}
                  <Box display="flex" flexWrap="wrap">
                    {getCheckBoxes("categories", slotsLabelsLists.categories)}
                  </Box>
                  <div className={classes.error}>
                    <ErrorMessage name="categories" />
                  </div>
                  <Field
                    component={RadioGroup}
                    name="type"
                    label="Tipo"
                    row
                    className={classes.field}
                  >
                    {createRadioButtons(slotsLabelsLists.types)}
                  </Field>
                  <div className={classes.error}>
                    <ErrorMessage name="type" />
                  </div>
                  <Box display="flex">
                    {getCheckBoxes("durations", slotsLabelsLists.durations)}
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
                <Button color="primary" onClick={onClose}>
                  Annulla
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
                  {slotToEdit ? "Modifica Slot" : "Crea Slot"}
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
    <FormControlLabel key={id} value={id} label={label} control={<Radio />} />
  ));
// ***** End Region Create Radio Buttons ***** //

// ***** Region Get Checkboxes ***** //
interface GetCheckBoxes {
  <N extends keyof Omit<SlotsLabelList, "types">>(
    name: N,
    values: SlotsLabelList[N]
  ): JSX.Element[];
}

/**
 * Creates checkbox elements for given entry (duration, slot type, notes)
 * @param name
 * @param values
 * @returns
 */
const getCheckBoxes: GetCheckBoxes = (name, values) =>
  values.map(({ id, label }) => (
    <MyCheckbox
      key={id.toString()}
      name={name}
      value={id.toString()}
      label={label}
    />
  ));
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

  return (
    <FormControlLabel
      control={<Checkbox {...{ name, value }} {...field} />}
      label={label}
    />
  );
};
// ***** End Region My Checkbox ***** //

// ***** Region Styles ***** //
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
// ***** End Region Styles ***** //

export default SlotForm;
