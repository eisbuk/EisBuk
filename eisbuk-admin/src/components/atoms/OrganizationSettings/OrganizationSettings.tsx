import React, { useState } from "react";
import * as Yup from "yup";
import { OrganizationData } from "eisbuk-shared/dist";

import { Formik, Field, Form } from "formik";
import { ValidationMessage } from "@/enums/translations";

import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Divider, Typography } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { getLocalAuth } from "@/store/selectors/auth";
import { updateOrganization } from "@/store/actions/organizationOperations";
import i18n from "@/i18next/i18n";

import Fields from "./OrganizationFields";
import AdminsField from "./AdminsField";

interface Props {
  organization: OrganizationData;
}

// #region validations
const OrganizationValidation = Yup.object().shape({
  smsFrom: Yup.string()
    .matches(/^[a-z0-9]+$/, i18n.t(ValidationMessage.InvalidSmsFrom))
    .max(11, i18n.t(ValidationMessage.InvalidSmsFromLength)),
});
// #endregion validations
const OrganizationSettings: React.FC<Props> = ({ organization }) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const userAuthInfo = useSelector(getLocalAuth);

  const [enableEdit, setEnableEdit] = useState(false);

  const handleSubmit = (orgData: OrganizationData) => {
    dispatch(updateOrganization(orgData));
    setEnableEdit(false);
  };

  const handleEnableEdit = (resetForm: () => void) => {
    if (enableEdit) resetForm();
    setEnableEdit(!enableEdit);
  };

  const currentUser = userAuthInfo?.email || "";
  return (
    <>
      <div className={classes.title}>
        <Typography variant="h4">{`${
          organization.displayName || "Organization"
        }  Settings`}</Typography>
      </div>
      <div className={classes.content}>
        <Formik
          {...{ initialValues: { ...organization } }}
          onSubmit={handleSubmit}
          validateOnChange={false}
          validationSchema={OrganizationValidation}
        >
          {({ errors, isSubmitting, isValidating, values, resetForm }) => (
            <>
              <h5 className={classes.sectionTitle}>Admins</h5>
              <AdminsField enableEdit={enableEdit} currentUser={currentUser} />
              <Divider />

              <Form className={classes.form}>
                <FormControl component="fieldset">
                  <h5 className={classes.sectionTitle}>Name</h5>
                  <Field
                    key="displayName"
                    label="Organization Name"
                    name="displayName"
                    className={classes.field}
                    as={TextField}
                    aria-label="Organization Name"
                    variant={enableEdit ? "outlined" : "filled"}
                    disabled={!enableEdit}
                    value={values.displayName || ""}
                  />

                  <Divider />

                  <Fields
                    enableEdit={enableEdit}
                    values={values}
                    errors={errors}
                  />
                </FormControl>

                <div className={classes.submitButtonArea}>
                  <Button
                    onClick={() => handleEnableEdit(resetForm)}
                    variant="contained"
                    disabled={
                      Boolean(Object.keys(errors).length) &&
                      (isSubmitting || isValidating)
                    }
                    color="primary"
                    aria-label={enableEdit ? "cancel" : "edit"}
                  >
                    {enableEdit ? "cancel" : "edit"}
                  </Button>

                  {enableEdit && (
                    <Button
                      variant="contained"
                      className={classes.saveButton}
                      disabled={
                        Boolean(Object.keys(errors).length) &&
                        (isSubmitting || isValidating)
                      }
                      color="secondary"
                      aria-label={"save"}
                      type="submit"
                    >
                      save
                    </Button>
                  )}
                </div>
              </Form>
            </>
          )}
        </Formik>
      </div>
    </>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
    width: "21rem",
  },
  fieldSection: {
    display: "flex",
    flexFlow: "wrap",
  },
  sectionTitle: {
    letterSpacing: 1,
    fontSize: theme.typography.pxToRem(18),
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
  },
  addAdminButton: {
    marginLeft: theme.spacing(3),
    borderRadius: theme.spacing(100),
  },
  adminFieldGroup: {
    display: "flex",
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: "12.5rem",
  },
  disabledAdminFieldGroup: {
    display: "flex",
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
    width: "11rem",
  },
  adminsList: {
    display: "flex",
    flexFlow: "wrap",
  },

  content: {
    width: "50rem",
    padding: "3rem",
  },
  closeButton: {
    transform: "translate(-150%,-25%)",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    width: "0px",
  },
  addAdmin: {
    marginBottom: theme.spacing(3),
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  form: {
    display: "flex",
    flexDirection: "column",
  },
  submitButtonArea: {
    display: "flex",
    padding: "8px",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  templateField: {
    width: "47rem",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  title: {
    position: "relative",
    fontWeight: 600,
    padding: 20,
    background: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.contrastText,
  },
  saveButton: {
    marginLeft: "1rem",
  },
  smsFromField: {
    width: "21rem",
    marginRight: theme.spacing(2),
  },
}));
// #endregion styles
export default OrganizationSettings;
