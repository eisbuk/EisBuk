import React from "react";
import makeStyles from "@mui/styles/makeStyles";
import * as yup from "yup";
import { Field, Form, Formik } from "formik";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import {
  useTranslation,
  ActionButton,
  ValidationMessage,
} from "@eisbuk/translations";

import ErrorMessage from "@/components/atoms/ErrorMessage";
import {
  __inputDialogSubmitId__,
  __emailInput__,
} from "@/__testData__/testIds";

// #region interfaces
interface Props {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (input: string) => void;
}

// #endregion interfaces

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .required(ValidationMessage.RequiredEntry)
    .email(ValidationMessage.Email),
});
/**
 * Input Dialog box
 * @param param0 props: title, children, open (boolean), setOpen (function), onSubmit (function)
 * @returns
 */
/**
 *
 * @TODO make this component generic for other types of input
 * or make it entirely email specifc
 */
const InputDialog: React.FC<Props> = ({
  title,
  children,
  open,
  setOpen,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const handleSubmit = (email: string) => {
    setOpen(false);
    onSubmit(email);
  };

  const handleReject = () => {
    setOpen(false);
  };

  const initialValues = { email: "" };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Formik
          onSubmit={(values) => {
            handleSubmit(values.email);
          }}
          {...{ initialValues, validationSchema }}
        >
          {({ errors }) => (
            <Form className={classes.inputContainer}>
              <Field
                name="email"
                type="email"
                className={classes.input}
                data-testid={__emailInput__}
              ></Field>
              <ErrorMessage className={classes.errorMessage}>
                {errors.email}
              </ErrorMessage>
              <div className={classes.buttons}>
                <Button
                  variant="contained"
                  onClick={handleReject}
                  color="secondary"
                >
                  {t(ActionButton.Cancel)}
                </Button>
                <Button
                  data-testid={__inputDialogSubmitId__}
                  variant="contained"
                  type="submit"
                  color="primary"
                >
                  {t(ActionButton.Submit)}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogActions>
    </Dialog>
  );
};

// #region styles
const useStyles = makeStyles(() => ({
  input: {
    padding: "0.5rem",
    border: "solid 0.25px",
    borderRadius: "0.25rem",
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingLeft: "1rem",
    paddingRight: "1rem",
  },
  buttons: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  errorMessage: {
    width: "100%",
    textAlign: "center",
    marginTop: "0.25rem",
    marginBottom: "1rem",
    whitespace: "normal",
    fontSize: 14,
  },
}));
// #endregion styles
export default InputDialog;
