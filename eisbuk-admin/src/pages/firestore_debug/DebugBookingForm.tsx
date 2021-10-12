import React from "react";
import { useDispatch } from "react-redux";
import { Field, Formik, Form, FormikHelpers } from "formik";
import { TextField } from "formik-material-ui";

import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

import { BookingSubCollection, OrgSubCollection } from "eisbuk-shared";

import { useFormStyles } from "./styles";

import { deleteDoc, DispatchFSBaseParams, submitDoc } from "./utils";

const initialValues = {
  id: "slot-id",
  date: "2020-03-03",
  interval: "10:00-11:00",
};

/**
 * A custioner form used to test/debug booking related firestore rules.
 * We're omitting the UI/UX here and focusing on string inputs to test firestore rules
 * against different scenarios.
 * 'onSubmit' it dispatches a firestore write (against emulated db) and shows the result.
 */
const DebugBookingForm: React.FC = () => {
  const classes = useFormStyles();
  const dispatch = useDispatch();

  const onSubmit = (
    values: typeof initialValues,
    { setSubmitting }: FormikHelpers<typeof initialValues>
  ) => {
    const { id: slotId, ...docValues } = values;

    dispatch(submitDoc({ ...getDispatchParams(slotId), docValues }));

    setSubmitting(false);
  };

  const handleDelete = (slotId: string) => () => {
    dispatch(deleteDoc(getDispatchParams(slotId)));
  };

  return (
    <Paper>
      <Formik {...{ initialValues, onSubmit }}>
        {({ values: { id: slotId } }) => (
          <Form className={classes.container}>
            <Typography variant="h4" className={classes.title}>
              Test for Booking
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
              name="interval"
              label="interval"
              component={TextField}
            />
            <div className={classes.buttonContainer}>
              <Button variant="contained" type="submit">
                Create/Update Booking
              </Button>
              <Button variant="contained" onClick={handleDelete(slotId)}>
                Delete Booking
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
 * @returns getRef callback and "booking" as docType
 */
const getDispatchParams = (slotId: string): DispatchFSBaseParams => ({
  docType: "booking",
  getRef: (org) =>
    org
      .collection(OrgSubCollection.Bookings)
      .doc("test-customer")
      .collection(BookingSubCollection.BookedSlots)
      .doc(slotId),
});

export default DebugBookingForm;
