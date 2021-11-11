import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import {
  getAuth,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { ActionButton } from "@/enums/translations";

const auth = getAuth();

interface Props {
  /**
   * On click handler for 'Cancel' button, should close the form
   */
  onCancel: () => void;
}

const LoginForm: React.FC<Props> = ({ onCancel }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [emailExists, setEmailExists] = useState<boolean | undefined>(
    undefined
  );

  const initialValues = {
    email: "",
    password: "",
  };

  /**
   * After the first step of login, checks that the email exists in our
   * firebase auth record. If exists, moves to second step (password), if not,
   * shows an error.
   */
  const checkEmail = async (email: string) => {
    const res = await fetchSignInMethodsForEmail(auth, email);
    console.log(res);
    setEmailExists(Boolean(res.length));
  };

  /**
   * On second step (after the email has been checked), handles `onSubmit` functionality:
   * Submits email and password, which then triggers login further (on firebase backend)
   * @param email
   * @param password
   */
  const login = async ({ email, password }: typeof initialValues) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");
      console.log(res);
    } catch (err) {
      const { code, message } = err as Record<string, string>;
      console.log("Error, code > ", code);
      console.log("Error, message > ", message);
    }
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!emailExists) {
      await checkEmail(values.email);
    } else {
      await login(values);
    }
  };

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .required()
      .test({ message: "Doesn't exist", test: () => emailExists !== false }),
  });

  return (
    <Formik
      {...{
        initialValues,
        validationSchema,
      }}
      onSubmit={handleSubmit}
    >
      <Form className={classes.container}>
        <Field
          type="email"
          name="email"
          label="email"
          // onFocus={() => setEmailExists(undefined)}
          component={TextField}
        />
        {emailExists && (
          <Field
            type="password"
            name="password"
            label="password"
            component={TextField}
          />
        )}
        <div className={classes.buttonsContainer}>
          <Button className={classes.cancelButton} onClick={onCancel}>
            {t(ActionButton.Cancel)}
          </Button>
          <Button className={classes.nextButton} type="submit">
            {t(ActionButton.Next)}
          </Button>
        </div>
      </Form>
    </Formik>
  );
};

const useStyles = makeStyles(() => ({
  container: {
    width: "100%",
    height: "15rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: "0 auto",
  },
  buttonsContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
  },
  cancelButton: {
    color: "white",
    background: "red",
  },
  nextButton: {
    color: "white",
    background: "blue",
  },
}));

export default LoginForm;
