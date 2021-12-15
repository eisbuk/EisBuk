import React from "react";
import { Form, Formik, Field, FormikConfig } from "formik";
import { useDispatch } from "react-redux";

import TextField from "@material-ui/core/TextField";
import Container from "@material-ui/core/Container";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { OrgMailConfig } from "eisbuk-shared";

import { updateMailConfig } from "@/store/actions/organizationOperations";

import { capitalizeFirst } from "@/utils/helpers";

/**
 * Mail config values flattened down to one level record
 */
type MailConfigValues = Omit<OrgMailConfig["config"], "auth"> &
  OrgMailConfig["template"] &
  OrgMailConfig["config"]["auth"];

const AdminPreferences: React.FC = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const initialValues: MailConfigValues = {
    from: "",
    host: "",
    pass: "",
    port: "",
    subject: "",
    user: "",
  };

  const onSubmit: FormikConfig<MailConfigValues>["onSubmit"] = (values) => {
    const { from, subject, ...config } = values;
    const { host, port, ...auth } = config;

    const mailConfig: OrgMailConfig = {
      config: {
        host,
        port,
        auth,
      },
      template: {
        from,
        subject,
      },
    };

    dispatch(updateMailConfig(mailConfig));
  };

  return (
    <Container className={classes.container}>
      <Formik {...{ initialValues, onSubmit }}>
        <Form>
          {Object.keys(initialValues).map((name) => (
            <Field
              className={classes.input}
              {...{ name }}
              label={capitalizeFirst(name)}
              as={TextField}
            />
          ))}
        </Form>
      </Formik>
    </Container>
  );
};

const useStyles = makeStyles(() => ({
  container: { height: "80%", marginTop: "10%", maxWidth: "50rem" },
  input: {
    width: "100%",
    marginBottom: "2rem",
  },
}));

export default AdminPreferences;
