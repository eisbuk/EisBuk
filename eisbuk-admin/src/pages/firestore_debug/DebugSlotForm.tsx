import React from "react";
import { useDispatch } from "react-redux";
import { Field, Formik, Form, FormikHelpers } from "formik";
import { TextField } from "formik-material-ui";
import * as yup from "yup";

import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

import { OrgSubCollection } from "eisbuk-shared";

import { useFormStyles } from "./styles";

import { deleteDoc, DispatchFSBaseParams, submitDoc, testJSON } from "./utils";

import { baseSlot } from "@/__testData__/slots";

/**
 * We're extracting intervals and categories (non string types)
 * in order to stringify them for form use
 */
const { intervals, categories, ...slotStrings } = baseSlot;

/**
 * We're using our test `baseSlot` as initial input
 */
const initialValues = {
  ...slotStrings,
  intervals: JSON.stringify(intervals, null, 2),
  categories: JSON.stringify(categories, null, 2),
};

const validationSchema = yup.object().shape({
  intervals: yup
    .string()
    .test({ test: testJSON, message: "Invalid JSON string" }),
  categories: yup
    .string()
    .test({ test: testJSON, message: "Invalid JSON string" }),
});

/**
 * A slot form used to test/debug slot related firestore rules.
 * We're omitting the UI/UX here and focusing on string inputs to test firestore rules
 * against different scenarios.
 * 'onSubmit' it dispatches a firestore write (against emulated db) and shows the result.
 */
const DebugSlotForm: React.FC = () => {
  const classes = useFormStyles();
  const dispatch = useDispatch();

  const onSubmit = (
    values: typeof initialValues,
    { setSubmitting }: FormikHelpers<typeof initialValues>
  ) => {
    const {
      intervals: intervalsString,
      categories: categoriesString,
      id: slotId,
      ...slotStrings
    } = values;
    const categories = JSON.parse(categoriesString);
    const intervals = JSON.parse(intervalsString);

    const docValues = { ...slotStrings, intervals, categories };

    dispatch(submitDoc({ ...getDispatchParams(slotId), docValues }));

    setSubmitting(false);
  };

  const handleDelete = (slotId: string) => () => {
    dispatch(deleteDoc(getDispatchParams(slotId)));
  };

  return (
    <Paper>
      <Formik {...{ initialValues, onSubmit, validationSchema }}>
        {({ values: { id: slotId } }) => (
          <Form className={classes.container}>
            <Typography variant="h4" className={classes.title}>
              Test for Slot
            </Typography>
            <Field
              className={classes.field}
              name="id"
              label="id"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="date"
              label="date"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="type"
              label="type"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="categories"
              label="categories"
              component={TextField}
              multiline
            />
            <Field
              className={classes.field}
              name="intervals"
              label="intervals"
              component={TextField}
              multiline
            />
            <Field
              className={classes.field}
              name="notes"
              label="notes"
              component={TextField}
            />
            <div className={classes.buttonContainer}>
              <Button variant="contained" type="submit">
                Create/Update Slot
              </Button>
              <Button variant="contained" onClick={handleDelete(slotId)}>
                Delete Slot
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

/**
 * Creates a base params for DispatchFS function
 * @param slotId
 * @returns getRef callback and "slot" as docType
 */
const getDispatchParams = (slotId: string): DispatchFSBaseParams => ({
  docType: "slot",
  getRef: (org) => org.collection(OrgSubCollection.Slots).doc(slotId),
});

export default DebugSlotForm;
