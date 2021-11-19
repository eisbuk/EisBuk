import React from "react";
import { useDispatch } from "react-redux";
import { Field, Formik, Form, FormikHelpers } from "formik";
import { TextField } from "formik-material-ui";

import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { __organization__ } from "@/lib/constants";

import { useFormStyles } from "./styles";

import { deleteDoc, DispatchFSBaseParams, submitDoc } from "./utils";

import { walt } from "@/__testData__/customers";

/**
 * We're using our test `walt` as initial customer input.
 * Covid certificate suspended will be false.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { covidCertificateSuspended, ...initialValues } = walt;

/**
 * A custioner form used to test/debug customer related firestore rules.
 * We're omitting the UI/UX here and focusing on string inputs to test firestore rules
 * against different scenarios.
 * 'onSubmit' it dispatches a firestore write (against emulated db) and shows the result.
 */
const DebugCustomerForm: React.FC = () => {
  const classes = useFormStyles();
  const dispatch = useDispatch();

  const onSubmit = (
    values: typeof initialValues,
    { setSubmitting }: FormikHelpers<typeof initialValues>
  ) => {
    const { id: customerId, ...customerValues } = values;

    const docValues = { ...customerValues, covidCertificateSuspended: false };

    dispatch(submitDoc({ ...getDispatchParams(customerId), docValues }));

    setSubmitting(false);
  };

  const handleDelete = (customerId: string) => () => {
    dispatch(deleteDoc(getDispatchParams(customerId)));
  };

  return (
    <Paper>
      <Formik {...{ initialValues, onSubmit }}>
        {({ values: { id: customerId } }) => (
          <Form className={classes.container}>
            <Typography variant="h4" className={classes.title}>
              Test for Customer
            </Typography>
            <Field
              className={classes.field}
              name="id"
              label="id"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="name"
              label="name"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="surname"
              label="surname"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="category"
              label="category"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="secretKey"
              label="secretKey"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="birthday"
              label="birthday"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="email"
              label="email"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="phone"
              label="phone"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="certificateExpiration"
              label="certificateExpiration"
              component={TextField}
            />
            <Field
              className={classes.field}
              name="covidCertificateReleaseDate"
              label="covidCertificateReleaseDate"
              component={TextField}
            />
            <div className={classes.buttonContainer}>
              <Button variant="contained" type="submit">
                Create/Update Customer
              </Button>
              <Button variant="contained" onClick={handleDelete(customerId)}>
                Delete Customer
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
 * @param customerId
 * @returns getRef callback and "customer" as docType
 */
const getDispatchParams = (customerId: string): DispatchFSBaseParams => ({
  docType: "booking",
  docPath: `${Collection.Organizations}/${__organization__}/${OrgSubCollection.Customers}/${customerId}`,
});

export default DebugCustomerForm;
